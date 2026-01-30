// Netlify Function: POST /api/meals -> /.netlify/functions/meals
// Generates meal suggestions with usage tracking

import { getFirestore, admin } from './_lib/firebaseAdmin.js';
import { parseJsonFromModel, OPENAI_MODEL, corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { ingredients, goal, filters } = body;

    console.log('🍽️  /api/meals called');
    console.log('   ingredients:', Array.isArray(ingredients) ? ingredients.length : 'not-an-array');
    console.log('   goal:', goal);
    console.log('   filters:', Array.isArray(filters) ? filters : 'none');

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return errorResponse('Missing ingredients (array of strings)', 400);
    }

    // ========================================================================
    // USAGE LIMIT ENFORCEMENT (Entitlements System)
    // ========================================================================
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
        console.log('   authenticated user:', userId);
      } catch (authError) {
        console.warn('   auth token invalid:', authError.message);
        // Continue without auth - free tier anonymous usage
      }
    }

    // If user is authenticated, check their entitlements
    if (userId) {
      const db = getFirestore();
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const tier = userData.tier || 'free';
        let { mealGenerationsUsed = 0, mealGenerationsLimit, nextResetAt } = userData;
        
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
            lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
            nextResetAt: admin.firestore.Timestamp.fromDate(nextReset),
          });
        }
        
        // Use mealGenerationsLimit from user doc, or fallback to tier defaults
        const tierLimits = {
          free: 25,
          premium: 150,
          pro: 500,
        };
        const limit = mealGenerationsLimit || tierLimits[tier] || 25;
        
        if (mealGenerationsUsed >= limit) {
          console.warn('   ⚠️  LIMIT REACHED for user:', userId, `(${mealGenerationsUsed}/${limit})`);
          return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'LIMIT_REACHED',
              message: `You've reached your monthly limit of ${limit} meal generations.`,
              tier,
              used: mealGenerationsUsed,
              limit,
              nextResetAt: resetDate.toISOString(),
            }),
          };
        }
        
        console.log('   usage check passed:', `${mealGenerationsUsed + 1}/${limit}`);
      } else {
        // User authenticated but no entitlements doc - create one
        console.log('   creating entitlements for new user:', userId);
        const now = new Date();
        const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await userRef.set({
          tier: 'free',
          tierStatus: 'active',
          mealGenerationsUsed: 0,
          mealGenerationsLimit: 25,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
          nextResetAt: admin.firestore.Timestamp.fromDate(nextReset),
        });
      }
    } else {
      console.log('   unauthenticated request - allowing (future: may add IP rate limiting)');
    }
    // ========================================================================

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TEXT_MODEL || OPENAI_MODEL;

    if (!apiKey) {
      return errorResponse('OPENAI_API_KEY not set', 500, 'Add OPENAI_API_KEY to Netlify environment variables');
    }

    const normalizedGoal = typeof goal === 'string' ? goal : 'maintain';
    const normalizedFilters = Array.isArray(filters) ? filters.filter((f) => typeof f === 'string') : [];

    const systemPrompt =
      'You are a smart, practical meal-planning assistant. ' +
      'Using ONLY the foods detected from the user\'s fridge scan plus common pantry staples ' +
      '(salt, pepper, oil, butter, basic spices), generate EXACTLY 10 distinct meal ideas. ' +
      'Help the user realistically decide what to eat using what they already have.';

    const userPrompt =
      'Available ingredients from fridge scan:\n' +
      ingredients.map((x) => `- ${x}`).join('\n') +
      `\n\nUser goal: ${normalizedGoal}` +
      `\nDietary filters: ${normalizedFilters.length ? normalizedFilters.join(', ') : 'none'}` +
      '\n\nMEAL MIX (STRICT):' +
      '\n- 5 simple, familiar "safe" meals (easy, comforting, weeknight-friendly)' +
      '\n- 3 creative but realistic "interesting" meals' +
      '\n- 2 slightly elevated "stretch" meals that feel impressive but achievable' +
      '\n\nRULES:' +
      '\n- Each meal must clearly use at least one scanned ingredient' +
      '\n- Do NOT invent exotic or specialty ingredients unless explicitly present' +
      '\n- Do NOT repeat the same main protein more than twice' +
      '\n- Avoid repeating cuisines or cooking styles' +
      '\n- No meal should feel like a minor variation of another' +
      '\n- Meal names should be short and clear (no emojis, no overly fancy wording)' +
      '\n\nOUTPUT FORMAT (STRICT):' +
      '\nReturn ONLY valid JSON with this exact structure:' +
      '\n{' +
      '\n  "meals": [' +
      '\n    {' +
      '\n      "id": string,' +
      '\n      "name": string (short and clear),' +
      '\n      "description": string (one concise sentence explaining the meal),' +
      '\n      "prepTime": string (e.g., "25 min"),' +
      '\n      "difficulty": "Easy"|"Medium"|"Hard",' +
      '\n      "healthScore": number (0-100, integer),' +
      '\n      "calories": number (integer),' +
      '\n      "protein": number (grams, integer),' +
      '\n      "carbs": number (grams, integer),' +
      '\n      "fat": number (grams, integer),' +
      '\n      "ingredients": string[] (key ingredients used from scan)' +
      '\n    }' +
      '\n  ]' +
      '\n}' +
      '\n\nGenerate exactly 10 meals following the meal mix structure. Be friendly, confident, practical, slightly premium but never pretentious.';

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
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
      return errorResponse('Meal generation request failed', 502, data);
    }

    const text = data?.choices?.[0]?.message?.content;
    const parsed = parseJsonFromModel(text);
    const meals = Array.isArray(parsed?.meals) ? parsed.meals : null;

    if (!meals) {
      return errorResponse('Model returned unexpected output', 502, { raw: text });
    }

    const sanitized = meals
      .filter((m) => m && typeof m.name === 'string')
      .slice(0, 10)
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
    if (userId) {
      const db = getFirestore();
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        mealGenerationsUsed: admin.firestore.FieldValue.increment(1),
      });
      console.log('   incremented usage counter for user:', userId);
    }
    
    return successResponse({ meals: sanitized });
  } catch (error) {
    console.error('❌ /api/meals failed:', error);
    return errorResponse('Meal generation failed', 500, error?.message || String(error));
  }
}
