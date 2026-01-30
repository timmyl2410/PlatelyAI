import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import Stripe from 'stripe';
import { getBucket, getFirestore, getAuth, admin as firebaseAdmin } from './firebaseAdmin.js';
import { computeRecipeImageId } from './recipeImageId.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null;

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS (allow all origins for mobile app compatibility)
app.use(cors({
  origin: true, // Allow all origins (mobile apps don't send proper Origin headers)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-ID'],
  maxAge: 86400, // Cache preflight for 24 hours
}));

// Explicit OPTIONS handler for preflight requests
app.options('*', cors());

// Stripe webhook needs raw body - must come before express.json()
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for all other routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount upload routes
app.use('/api', uploadRoutes);

// Initialize Firebase Admin lazily via helpers when needed.

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'platelyai',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      '/health',
      '/api/scan',
      '/api/categorize-food',
      '/api/meals',
      '/api/meal-image',
      '/api/upload',
      '/api/session/:id',
      '/api/sessions',
      '/api/create-checkout-session',
      '/api/create-billing-portal-session',
      '/api/stripe-webhook',
    ],
  });
});

// ============================================================================
// HELPERS
// ============================================================================
const parseJsonFromModel = (text) => {
  if (!text || typeof text !== 'string') return null;

  // Try direct JSON
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  // Try extracting the first JSON object/array
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);

  if (start === -1) return null;

  const snippet = text.slice(start).trim();
  for (let end = snippet.length; end > 0; end--) {
    const candidate = snippet.slice(0, end);
    try {
      return JSON.parse(candidate);
    } catch {
      // keep shrinking
    }
  }

  return null;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Limit concurrent image generations to reduce OpenAI rate-limit/overload errors
// when the frontend requests multiple meal images in parallel.
const MAX_PARALLEL_IMAGE_GENERATIONS = Math.max(
  1,
  Number.parseInt(process.env.MAX_PARALLEL_IMAGE_GENERATIONS || '1', 10) || 1
);

let imageGenAvailable = MAX_PARALLEL_IMAGE_GENERATIONS;
const imageGenWaiters = [];

const acquireImageGenSlot = async () => {
  if (imageGenAvailable > 0) {
    imageGenAvailable -= 1;
    return;
  }
  await new Promise((resolve) => imageGenWaiters.push(resolve));
};

const releaseImageGenSlot = () => {
  const next = imageGenWaiters.shift();
  if (next) {
    next();
    return;
  }
  imageGenAvailable = Math.min(MAX_PARALLEL_IMAGE_GENERATIONS, imageGenAvailable + 1);
};

const extractBase64Image = (openAiImagesResponse) => {
  const first = openAiImagesResponse?.data?.[0];
  const b64 = first?.b64_json || first?.b64 || first?.base64;
  if (typeof b64 !== 'string' || !b64.trim()) return null;
  return b64;
};

const extractImageUrl = (openAiImagesResponse) => {
  const first = openAiImagesResponse?.data?.[0];
  const url = first?.url;
  if (typeof url !== 'string' || !url.trim()) return null;
  return url;
};

const downloadUrlToBuffer = async (url) => {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to download image: ${resp.status}`);
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================================================
// DATA STORAGE (In-memory - use a database in production)
// ============================================================================
// This stores session data. Each session has an ID and list of uploaded images
const sessions = new Map();

// ============================================================================
// API ENDPOINT 1: Create a new session with a unique ID
// GET /api/sessions
// Returns: { sessionId: "abc-123-def" }
// ============================================================================
app.get('/api/sessions', (req, res) => {
  const sessionId = uuidv4();
  
  // Store empty session
  sessions.set(sessionId, {
    id: sessionId,
    createdAt: new Date(),
    images: [],
  });

  console.log(`✅ Session created: ${sessionId}`);
  res.json({ sessionId });
});

// ============================================================================
// API ENDPOINT 2: Upload an image to a session
// POST /api/upload
// Body: { sessionId: "abc-123-def", base64Image: "data:image/jpeg;base64,..." }
// Returns: { success: true, url: "cloudinary-url" }
// ============================================================================
app.post('/api/upload', async (req, res) => {
  console.log('📨 Upload request received');
  console.log('📦 Body keys:', Object.keys(req.body));
  console.log('📦 SessionId:', req.body.sessionId);
  console.log('🖼️  Image size:', req.body.base64Image?.length || 0, 'bytes');

  try {
    const { sessionId, base64Image } = req.body;

    // Validate inputs
    if (!sessionId || !base64Image) {
      return res.status(400).json({ error: 'Missing sessionId or image data' });
    }

    // Check if session exists
    if (!sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Upload to Cloudinary
    console.log(`📤 Uploading image for session ${sessionId}...`);
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `platify/${sessionId}`,
      resource_type: 'auto',
    });

    // Store image URL in session
    const session = sessions.get(sessionId);
    session.images.push({
      url: result.secure_url,
      uploadedAt: new Date(),
      cloudinaryPublicId: result.public_id,
    });

    console.log(`✅ Image uploaded: ${result.secure_url}`);
    res.json({
      success: true,
      url: result.secure_url,
      images: session.images,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// ============================================================================
// API ENDPOINT 3: Get all images for a session
// GET /api/session/:sessionId
// Returns: { images: [...], id: "abc-123-def" }
// ============================================================================
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const session = sessions.get(sessionId);
  res.json(session);
});

// ============================================================================
// FIREBASE AUTH MIDDLEWARE
// ============================================================================
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
};

// ============================================================================
// API ENDPOINT 4: Scan images to detect foods (Vision model)
// POST /api/scan
// Body: { imageUrls: string[] | images: Array<{url: string}>, userId?: string }
// Returns: { foods: [{ name: string, category: string }], scanId: string }
// ============================================================================
app.post('/api/scan', verifyFirebaseToken, async (req, res) => {
  const db = getFirestore();
  const scanId = uuidv4();
  let scanRunRef = null;

  try {
    // Support both imageUrls and images[] formats
    let imageUrls = req.body.imageUrls;
    if (!imageUrls && Array.isArray(req.body.images)) {
      imageUrls = req.body.images.map(img => typeof img === 'string' ? img : img.url);
    }
    const userId = req.body.userId || req.userId; // Use authenticated user if not provided

    console.log('🧠 /api/scan called');
    console.log('   imageUrls:', Array.isArray(imageUrls) ? imageUrls.length : 'not-an-array');
    console.log('   userId:', userId);
    console.log('   authenticated as:', req.user?.email || req.userId);

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'Missing imageUrls (array)' });
    }

    // Create scan run document if userId provided
    if (userId) {
      scanRunRef = db.doc(`scans/${userId}/runs/${scanId}`);
      await scanRunRef.set({
        status: 'processing',
        startedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        imageCount: imageUrls.length,
      });
      console.log(`   📝 Created scan run: scans/${userId}/runs/${scanId}`);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    console.log('   model:', model);
    console.log('   apiKey set:', Boolean(apiKey));

    if (!apiKey) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY not set',
        hint: 'Add OPENAI_API_KEY to backend/.env then restart the backend server.',
      });
    }

    const systemPrompt =
      'You are a food-ingredient detector. Given one or more photos of a fridge and/or pantry, return the best-effort list of distinct food items.';

    const userText =
      'Return ONLY valid JSON with this exact shape: {"foods": [{"name": string, "category": "Proteins"|"Vegetables"|"Dairy"|"Pantry"|"Other"}] }\n' +
      'Rules: (1) Deduplicate similar items. (2) Prefer specific names (e.g., "chicken breast" not "meat"). (3) If unsure, put category "Other". (4) No extra keys, no markdown.';

    const content = [
      { type: 'text', text: userText },
      ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
    ];

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content },
        ],
      }),
    });

    const data = await resp.json();
    console.log('   OpenAI status:', resp.status);
    if (!resp.ok) {
      console.error('❌ OpenAI error:', data);
      return res.status(502).json({ error: 'Vision model request failed', details: data });
    }

    const text = data?.choices?.[0]?.message?.content;
    const parsed = parseJsonFromModel(text);

    if (Array.isArray(parsed?.foods)) {
      console.log('   foods detected:', parsed.foods.length);
    }

    if (!parsed || !Array.isArray(parsed.foods)) {
      return res.status(502).json({
        error: 'Model returned unexpected output',
        raw: text,
      });
    }

    // Basic sanitation
    const foods = parsed.foods
      .filter((f) => f && typeof f.name === 'string' && typeof f.category === 'string')
      .map((f) => ({ name: f.name.trim(), category: f.category.trim() }));

    // Update scan run to done
    if (scanRunRef) {
      await scanRunRef.update({
        status: 'done',
        completedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        extractedCount: foods.length,
      });
      console.log(`   ✅ Scan run completed: ${foods.length} foods extracted`);
    }

    return res.json({ foods, scanId });
  } catch (error) {
    console.error('❌ /api/scan failed:', error);

    // Update scan run to failed
    if (scanRunRef) {
      try {
        await scanRunRef.update({
          status: 'failed',
          completedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          error: error?.message || String(error),
        });
      } catch (updateError) {
        console.error('Failed to update scan run status:', updateError);
      }
    }

    return res.status(500).json({ error: 'Scan failed', details: error?.message || String(error) });
  }
});

// ============================================================================
// API ENDPOINT: Categorize a single food item using AI
// POST /api/categorize-food
// Body: { foodName: string }
// Returns: { category: string }
// ============================================================================
app.post('/api/categorize-food', async (req, res) => {
  try {
    const { foodName } = req.body;

    console.log('🏷️  /api/categorize-food called');
    console.log('   foodName:', foodName);

    if (!foodName || typeof foodName !== 'string') {
      return res.status(400).json({ error: 'Missing foodName (string)' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY not set',
        hint: 'Add OPENAI_API_KEY to backend/.env then restart the backend server.',
      });
    }

    const systemPrompt = 'You are categorizing food items for a food-tracking app called PlatelyAI.';
    
    const userPrompt = `Food item: "${foodName}"

Available categories:
Produce, Meat, Dairy, Grains, Pantry, Frozen, Snacks, Beverages, Condiments, Other

Respond with ONLY one category from the list above.
If none fit well, respond with "Other".

No explanations. No extra text. One-word response only.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 10,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const data = await resp.json();
    console.log('   OpenAI status:', resp.status);
    
    if (!resp.ok) {
      console.error('❌ OpenAI error:', data);
      return res.status(502).json({ error: 'Categorization request failed', details: data });
    }

    const category = data?.choices?.[0]?.message?.content?.trim() || 'Other';
    
    // Validate the category is in the allowed list
    const validCategories = ['Produce', 'Meat', 'Dairy', 'Grains', 'Pantry', 'Frozen', 'Snacks', 'Beverages', 'Condiments', 'Other'];
    const finalCategory = validCategories.includes(category) ? category : 'Other';

    console.log('   category:', finalCategory);
    return res.json({ category: finalCategory });
  } catch (error) {
    console.error('❌ /api/categorize-food failed:', error);
    return res.status(500).json({ error: 'Categorization failed', details: error?.message || String(error) });
  }
});

// ============================================================================
// API ENDPOINT 5: Generate meals from ingredients
// POST /api/meals
// Body: { ingredients: string[], goal?: string, filters?: string[] }
// Returns: { meals: Meal[] }
// ============================================================================
app.post('/api/meals', async (req, res) => {
  try {
    const { ingredients, goal, filters, count, excludeMealNames } = req.body;

    console.log('🍽️  /api/meals called');
    console.log('   ingredients:', Array.isArray(ingredients) ? ingredients.length : 'not-an-array');
    console.log('   goal:', goal);
    console.log('   filters:', Array.isArray(filters) ? filters : 'none');
    console.log('   count:', count);
    console.log('   excludeMealNames:', Array.isArray(excludeMealNames) ? excludeMealNames : 'none');

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Missing ingredients (array of strings)' });
    }

    // ========================================================================
    // USAGE LIMIT ENFORCEMENT (Entitlements System)
    // ========================================================================
    const authHeader = req.headers.authorization;
    let userId = null;
    
    console.log('   Authorization header present:', !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      console.log('   Attempting to verify Firebase token...');
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
        console.log('   ✓ authenticated user:', userId);
      } catch (authError) {
        console.warn('   ❌ auth token invalid:', authError.message);
        // Continue without auth - free tier anonymous usage
      }
    } else {
      console.log('   No Bearer token found in Authorization header');
    }

    // If user is authenticated, check their entitlements
    if (userId) {
      const db = getFirestore();
      const userRef = db.collection('userEntitlements').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const tier = userData.tier || 'free';
        let { mealGenerationsUsed = 0, nextResetAt } = userData;
        
        // Check if monthly reset is needed
        const now = new Date();
        const resetDate = nextResetAt?.toDate?.() || new Date(nextResetAt || 0);
        
        if (now >= resetDate) {
          console.log('   resetting monthly usage for user:', userId);
          mealGenerationsUsed = 0;
          // Set next reset to 1st of next month
          const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          await userRef.update({
            mealGenerationsUsed: 0,
            lastResetAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            nextResetAt: firebaseAdmin.firestore.Timestamp.fromDate(nextReset),
          });
        }
        
        // Check usage limits based on tier
        const tierLimits = {
          free: 30,
          premium: 150,
          pro: 500,
        };
        const limit = tierLimits[tier] || 30;
        
        if (mealGenerationsUsed >= limit) {
          console.warn('   ⚠️  LIMIT REACHED for user:', userId, `(${mealGenerationsUsed}/${limit})`);
          return res.status(403).json({
            error: 'LIMIT_REACHED',
            message: `You've reached your monthly limit of ${limit} meal generations.`,
            tier,
            used: mealGenerationsUsed,
            limit,
            nextResetAt: resetDate.toISOString(),
          });
        }
        
        console.log('   usage check passed:', `${mealGenerationsUsed + 1}/${limit}`);
      } else {
        // User authenticated but no entitlements doc - create one
        console.log('   creating entitlements for new user:', userId);
        const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await userRef.set({
          tier: 'free',
          status: 'active',
          mealGenerationsUsed: 0,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          lastResetAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          nextResetAt: firebaseAdmin.firestore.Timestamp.fromDate(nextReset),
        });
      }
    } else {
      console.log('   unauthenticated request - allowing (future: may add IP rate limiting)');
    }
    // ========================================================================

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY not set',
        hint: 'Add OPENAI_API_KEY to backend/.env then restart the backend server.',
      });
    }

    const normalizedGoal = typeof goal === 'string' ? goal : 'maintain';
    const normalizedFilters = Array.isArray(filters) ? filters.filter((f) => typeof f === 'string') : [];
    const mealsToGenerate = typeof count === 'number' && count >= 1 ? Math.min(count, 5) : 5;
    const excludeList = Array.isArray(excludeMealNames) ? excludeMealNames.filter(n => typeof n === 'string' && n.trim()).map(n => n.trim()) : [];

    const systemPrompt =
      'You are a nutrition-aware meal planner. You generate realistic, well-known meals based on available ingredients. Only suggest real recipes that exist in cookbooks or are commonly made. You must return ONLY valid JSON.';

    let exclusionText = '';
    if (excludeList.length > 0) {
      exclusionText = `\n\n⚠️ IMPORTANT: Do NOT suggest any of these meals (user has already seen them):\n${excludeList.map(n => `- ${n}`).join('\n')}\n\nYou MUST suggest completely different meals with different names.`;
    }

    const userPrompt =
      'Given these available ingredients:\n' +
      ingredients.map((x) => `- ${x}`).join('\n') +
      `\n\nUser goal: ${normalizedGoal}` +
      `\nDietary filters: ${normalizedFilters.length ? normalizedFilters.join(', ') : 'none'}` +
      exclusionText +
      '\n\nReturn ONLY JSON with this exact shape:' +
      '\n{' +
      '"meals": [' +
      '{"id": string, "name": string, "description": string, "prepTime": string, "difficulty": "Easy"|"Medium"|"Hard", "healthScore": number, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[]}' +
      ']}' +
      '\n\nRules:' +
      `\n- Generate exactly ${mealsToGenerate} meal${mealsToGenerate > 1 ? 's' : ''}.` +
      '\n- Only suggest real, well-known recipes that actually exist (e.g., "Chicken Stir-Fry", "Spaghetti Carbonara", "Greek Salad"). Do NOT invent creative fusion dishes or made-up meal names.' +
      '\n- Meals should mostly use the provided ingredients; you may add up to 3 common pantry staples per meal (salt, pepper, oil, water, etc.).' +
      '\n- calories/protein/carbs/fat should be plausible estimates (integers, in grams for macros).' +
      '\n- healthScore must be an integer between 0-100 (where 100 is extremely healthy, 70-85 is moderately healthy, below 70 is less healthy).' +
      '\n- Keep prepTime like "25 min".' +
      '\n- No markdown, no extra keys.';

    // Increase temperature for single meal regeneration to get more variety
    const temperature = count === 1 ? 0.9 : 0.3;
    
    console.log('   temperature:', temperature, '(higher for single meal regen)');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const data = await resp.json();
    console.log('   OpenAI status:', resp.status);
    if (!resp.ok) {
      console.error('❌ OpenAI error:', data);
      return res.status(502).json({ error: 'Meal generation request failed', details: data });
    }

    const text = data?.choices?.[0]?.message?.content;
    const parsed = parseJsonFromModel(text);
    const meals = Array.isArray(parsed?.meals) ? parsed.meals : null;

    if (!meals) {
      return res.status(502).json({ error: 'Model returned unexpected output', raw: text });
    }

    const sanitized = meals
      .filter((m) => m && typeof m.name === 'string')
      .slice(0, mealsToGenerate)
      .map((m, idx) => {
        const mealName = String(m.name).trim();
        // Generate a recipe search URL using AllRecipes (reliable recipe site)
        const recipeUrl = `https://www.allrecipes.com/search?q=${encodeURIComponent(mealName)}`;
        
        return {
          id: typeof m.id === 'string' && m.id.trim() ? m.id : String(idx + 1),
          name: mealName,
          description: String(m.description || '').trim(),
          prepTime: String(m.prepTime || '').trim(),
          difficulty: ['Easy', 'Medium', 'Hard'].includes(m.difficulty) ? m.difficulty : 'Easy',
          healthScore: Number.isFinite(Number(m.healthScore)) ? Math.max(0, Math.min(100, Math.round(Number(m.healthScore)))) : 75,
          calories: Number.isFinite(Number(m.calories)) ? Math.round(Number(m.calories)) : 450,
          protein: Number.isFinite(Number(m.protein)) ? Math.round(Number(m.protein)) : 25,
          carbs: Number.isFinite(Number(m.carbs)) ? Math.round(Number(m.carbs)) : 50,
          fat: Number.isFinite(Number(m.fat)) ? Math.round(Number(m.fat)) : 15,
          ingredients: Array.isArray(m.ingredients) ? m.ingredients.map((x) => String(x)) : [],
          recipeUrl,
        };
      });

    console.log('   meals generated:', sanitized.length);
    
    // Increment usage counter after successful generation
    // Each meal generated counts as 1 generation
    if (userId) {
      const db = getFirestore();
      const userRef = db.collection('userEntitlements').doc(userId);
      const mealsGenerated = sanitized.length;
      await userRef.update({
        mealGenerationsUsed: firebaseAdmin.firestore.FieldValue.increment(mealsGenerated),
      });
      console.log(`   incremented usage counter by ${mealsGenerated} for user:`, userId);
    }
    
    return res.json({ meals: sanitized });
  } catch (error) {
    console.error('❌ /api/meals failed:', error);
    return res.status(500).json({ error: 'Meal generation failed', details: error?.message || String(error) });
  }
});

// ============================================================================
// HELPERS FOR INTELLIGENT IMAGE MATCHING
// ============================================================================

/**
 * Normalize ingredients for comparison (lowercase, no special chars)
 */
const normalizeIngredient = (ingredient) => {
  return String(ingredient || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

/**
 * Calculate ingredient overlap between two meals (0-1 scale)
 */
const calculateIngredientSimilarity = (ingredients1, ingredients2) => {
  const set1 = new Set(ingredients1.map(normalizeIngredient).filter(Boolean));
  const set2 = new Set(ingredients2.map(normalizeIngredient).filter(Boolean));
  
  if (set1.size === 0 || set2.size === 0) return 0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity: intersection / union
  return intersection.size / union.size;
};

/**
 * Search Firestore for existing meal images with similar ingredients
 * Returns best match if similarity >= threshold
 */
const findSimilarMealImage = async (keyIngredients, similarityThreshold = 0.6) => {
  const firestore = getFirestore();
  const snapshot = await firestore.collection('recipeImages').where('downloadUrl', '!=', null).limit(100).get();
  
  let bestMatch = null;
  let bestScore = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (!data.downloadUrl) return;
    
    const storedIngredients = data.keyIngredients || data.ingredients || [];
    const similarity = calculateIngredientSimilarity(keyIngredients, storedIngredients);
    
    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = {
        recipeImageId: doc.id,
        imageUrl: data.downloadUrl,
        title: data.title,
        similarity,
      };
    }
  });

  if (bestMatch && bestScore >= similarityThreshold) {
    return bestMatch;
  }
  
  return null;
};

// ============================================================================
// API ENDPOINT 6: Generate (or reuse) a meal preview image
// POST /api/meal-image
// Body: { title: string, keyIngredients: string[] }
// Returns: { recipeImageId: string, imageUrl: string, matched?: boolean }
//
// Intelligent matching:
// 1. Searches existing images by ingredient similarity
// 2. If match found (≥60% overlap), reuses existing image
// 3. Otherwise generates new image and stores with metadata
//
// Caches results in:
// - Firestore: recipeImages/{recipeImageId} (with keyIngredients metadata)
// - Storage: meal-images/{recipeImageId}.png
// ============================================================================
app.post('/api/meal-image', async (req, res) => {
  try {
    const { title, keyIngredients } = req.body || {};

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Missing title (string)' });
    }
    if (!Array.isArray(keyIngredients)) {
      return res.status(400).json({ error: 'Missing keyIngredients (string[])' });
    }

    // Try to find a similar existing meal image first
    const similarMatch = await findSimilarMealImage(keyIngredients);
    if (similarMatch) {
      console.log(`✅ Matched existing image for "${title}" (${Math.round(similarMatch.similarity * 100)}% similar to "${similarMatch.title}")`);
      return res.json({
        recipeImageId: similarMatch.recipeImageId,
        imageUrl: similarMatch.imageUrl,
        matched: true,
        matchedTitle: similarMatch.title,
        similarity: similarMatch.similarity,
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const imageModel = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
    const fallbackImageModel = process.env.OPENAI_IMAGE_FALLBACK_MODEL || 'dall-e-3';
    if (!apiKey) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY not set',
        hint: 'Add OPENAI_API_KEY to backend/.env then restart the backend server.',
      });
    }

    const { recipeImageId, signature } = computeRecipeImageId({ title, keyIngredients });
    const firestore = getFirestore();
    const bucket = getBucket();

    const docRef = firestore.collection('recipeImages').doc(recipeImageId);
    const imagePath = `meal-images/${recipeImageId}.png`;

    // Idempotency / race-avoidance with recovery:
    // Use a short lease stored in Firestore so we can recover from crashes or previous failures
    // that left a placeholder doc without downloadUrl.
    const leaseId = uuidv4();
    const leaseMs = 2 * 60 * 1000;
    const nowMs = Date.now();

    const leaseResult = await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (snap.exists) {
        const data = snap.data() || {};
        if (data.downloadUrl) {
          return { done: true, imageUrl: data.downloadUrl };
        }

        const leaseExpiresAt = data.leaseExpiresAt?.toMillis ? data.leaseExpiresAt.toMillis() : null;
        if (!leaseExpiresAt || leaseExpiresAt < nowMs) {
          tx.set(
            docRef,
            {
              signature,
              title: title.trim(),
              imagePath,
              downloadUrl: null,
              leaseId,
              leaseExpiresAt: firebaseAdmin.firestore.Timestamp.fromMillis(nowMs + leaseMs),
              updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
              createdAt: data.createdAt || firebaseAdmin.firestore.FieldValue.serverTimestamp(),
              lastError: firebaseAdmin.firestore.FieldValue.delete(),
            },
            { merge: true }
          );
          return { done: false, iAmGenerator: true };
        }

        return { done: false, iAmGenerator: false };
      }

      tx.create(docRef, {
        signature,
        title: title.trim(),
        keyIngredients: keyIngredients.slice(0, 12), // Store for future matching
        imagePath,
        downloadUrl: null,
        leaseId,
        leaseExpiresAt: firebaseAdmin.firestore.Timestamp.fromMillis(nowMs + leaseMs),
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      return { done: false, iAmGenerator: true };
    });

    if (leaseResult?.done) {
      return res.json({ recipeImageId, imageUrl: leaseResult.imageUrl });
    }

    if (!leaseResult?.iAmGenerator) {
      // Wait briefly for the other request to finish generating.
      for (let attempt = 0; attempt < 12; attempt++) {
        const snap = await docRef.get();
        if (snap.exists) {
          const data = snap.data();
          if (data?.downloadUrl) {
            return res.json({ recipeImageId, imageUrl: data.downloadUrl });
          }
          if (data?.lastError) {
            return res.status(502).json({
              recipeImageId,
              error: 'Image generation previously failed',
              details: data.lastError,
            });
          }
        }
        await sleep(500);
      }
      return res.status(202).json({
        recipeImageId,
        error: 'Image generation in progress. Please retry shortly.',
      });
    }

    const prompt = `High-quality realistic food photo of ${title.trim()}. Natural lighting, plated nicely, shallow depth of field. No text, no watermark.`;

    const makeOpenAiImageRequest = async (body) => {
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const data = await resp.json().catch(() => ({}));
      return { resp, data };
    };

    const shouldRetryOpenAi = (status, data) => {
      if (status === 429) return true;
      if (status >= 500 && status <= 599) return true;
      const msg = data?.error?.message;
      if (typeof msg === 'string' && msg.toLowerCase().includes('temporarily')) return true;
      return false;
    };

    const requestOpenAiWithRetries = async (body) => {
      let attempt = 0;
      while (true) {
        const out = await makeOpenAiImageRequest(body);
        if (out.resp.ok) return out;
        if (!shouldRetryOpenAi(out.resp.status, out.data) || attempt >= 3) return out;
        const delayMs = Math.min(8000, 750 * Math.pow(2, attempt));
        await sleep(delayMs);
        attempt += 1;
      }
    };

    const tryRequest = async (model, includeResponseFormat) => {
      const body = {
        model,
        prompt,
        size: '1024x1024',
      };
      if (includeResponseFormat) body.response_format = 'b64_json';
      return requestOpenAiWithRetries(body);
    };

    // Concurrency limit: avoid multiple simultaneous OpenAI image generations from the UI.
    await acquireImageGenSlot();

    let openAi;
    try {
      // Some OpenAI Images variants reject response_format; try with it first, then retry without.
      openAi = await tryRequest(imageModel, true);

      if (!openAi.resp.ok) {
        const msg = openAi?.data?.error?.message;
        const param = openAi?.data?.error?.param;
        if (typeof msg === 'string' && msg.toLowerCase().includes('unknown parameter') && param === 'response_format') {
          openAi = await tryRequest(imageModel, false);
        }
      }

      // If gpt-image-1 (or another restricted model) is blocked, fall back to a more widely available model.
      if (!openAi.resp.ok) {
        const msg = openAi?.data?.error?.message;
        if (typeof msg === 'string' && msg.toLowerCase().includes('must be verified')) {
          openAi = await tryRequest(fallbackImageModel, false);
        }
      }
    } finally {
      releaseImageGenSlot();
    }

    if (!openAi.resp.ok) {
      console.error('❌ OpenAI image error:', openAi.data);
      try {
        await docRef.set(
          {
            lastError: openAi?.data?.error?.message || openAi?.data,
            leaseId: firebaseAdmin.firestore.FieldValue.delete(),
            leaseExpiresAt: firebaseAdmin.firestore.FieldValue.delete(),
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // ignore
      }
      return res.status(502).json({ error: 'Image generation request failed', details: openAi.data });
    }

    const b64 = extractBase64Image(openAi.data);
    const url = extractImageUrl(openAi.data);
    let buffer = null;

    if (b64) buffer = Buffer.from(b64, 'base64');
    else if (url) buffer = await downloadUrlToBuffer(url);

    if (!buffer) {
      try {
        await docRef.set(
          {
            lastError: 'Image API returned no usable image data',
            leaseId: firebaseAdmin.firestore.FieldValue.delete(),
            leaseExpiresAt: firebaseAdmin.firestore.FieldValue.delete(),
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // ignore
      }
      return res.status(502).json({ error: 'Image API returned no usable image data', details: openAi.data });
    }

    const file = bucket.file(imagePath);
    await file.save(buffer, {
      contentType: 'image/png',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    // Signed URL (long expiry) so we don't need to make the bucket public.
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '2036-01-01',
    });

    await docRef.set(
      {
        signature,
        title: title.trim(),
        keyIngredients: keyIngredients.slice(0, 12), // Store for future matching
        imagePath,
        downloadUrl: signedUrl,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        leaseId: firebaseAdmin.firestore.FieldValue.delete(),
        leaseExpiresAt: firebaseAdmin.firestore.FieldValue.delete(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.json({ recipeImageId, imageUrl: signedUrl });
  } catch (error) {
    console.error('❌ /api/meal-image failed:', error);
    return res.status(500).json({ error: 'Meal image failed', details: error?.message || String(error) });
  }
});

// ============================================================================
// STRIPE PAYMENT ENDPOINTS
// ============================================================================

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { userId, userEmail, priceId } = req.body;

    if (!userId || !priceId) {
      return res.status(400).json({ error: 'Missing userId or priceId' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail || undefined,
      line_items: [
        {
          price: priceId || process.env.STRIPE_PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
      metadata: {
        userId: userId,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('❌ Create checkout session failed:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error?.message });
  }
});

// Stripe webhook handler
app.post('/api/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return res.status(500).send('Stripe not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    console.log(`📦 Webhook event received: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        console.log(`   Session metadata:`, session.metadata);
        console.log(`   User ID from metadata: ${userId}`);

        if (userId) {
          console.log(`✓ Payment successful for user ${userId}`);
          
          // Update user tier in Firestore
          const db = getFirestore();
          const docRef = db.collection('userEntitlements').doc(userId);
          
          await docRef.set(
            {
              tier: 'premium',
              mealGenerationsLimit: 150,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // Verify the write
          const verifyDoc = await docRef.get();
          console.log(`✓ User ${userId} upgraded to premium in Firestore`);
          console.log(`   Verified tier in Firestore: ${verifyDoc.data()?.tier}`);
        } else {
          console.error('❌ No userId in session metadata');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by Stripe customer ID
        const db = getFirestore();
        const snapshot = await db
          .collection('userEntitlements')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const status = subscription.status;

          // Update tier based on subscription status
          const tier = status === 'active' ? 'premium' : 'free';
          await doc.ref.update({
            tier: tier,
            subscriptionStatus: status,
            updatedAt: new Date().toISOString(),
          });

          console.log(`✓ Subscription updated for ${doc.id}: ${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by Stripe customer ID
        const db = getFirestore();
        const snapshot = await db
          .collection('userEntitlements')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          await doc.ref.update({
            tier: 'free',
            subscriptionStatus: 'canceled',
            updatedAt: new Date().toISOString(),
          });

          console.log(`✓ Subscription canceled for ${doc.id}, downgraded to free`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 PlatelyAI Backend Server Started`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 PORT: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n✅ Routes mounted:`);
  console.log(`   GET  /health (public)`);
  console.log(`   POST /api/scan (🔒 auth required)`);
  console.log(`   POST /api/categorize-food`);
  console.log(`   POST /api/meals`);
  console.log(`   POST /api/meal-image`);
  console.log(`   POST /api/uploads/init (🔒 auth required)`);
  console.log(`   POST /api/uploads/complete (🔒 auth required)`);
  console.log(`   GET  /api/sessions`);
  console.log(`   GET  /api/session/:sessionId`);
  console.log(`   POST /api/create-checkout-session`);
  console.log(`   POST /api/create-billing-portal-session`);
  console.log(`   POST /api/stripe-webhook`);
  console.log(`\n🔑 Firebase Auth: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'Configured' : '⚠️  Missing'}`);
  console.log(`🤖 OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : '⚠️  Missing'}`);
  console.log(`💳 Stripe API: ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`${'='.repeat(60)}\n`);
});
