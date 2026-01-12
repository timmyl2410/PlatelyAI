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
        let { generationsUsed = 0, nextResetAt } = userData;
        
        // Check if monthly reset is needed
        const now = new Date();
        const resetDate = nextResetAt?.toDate?.() || new Date(nextResetAt || 0);
        
        if (now >= resetDate) {
          console.log('   resetting monthly usage for user:', userId);
          generationsUsed = 0;
          // Set next reset to 1st of next month
          const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          await userRef.update({
            generationsUsed: 0,
            lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
            nextResetAt: admin.firestore.Timestamp.fromDate(nextReset),
          });
        }
        
        // Check usage limits based on tier
        const tierLimits = {
          free: 25,
          premium: 150,
          pro: 500,
        };
        const limit = tierLimits[tier] || 25;
        
        if (generationsUsed >= limit) {
          console.warn('   ⚠️  LIMIT REACHED for user:', userId, `(${generationsUsed}/${limit})`);
          return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'LIMIT_REACHED',
              message: `You've reached your monthly limit of ${limit} meal generations.`,
              tier,
              used: generationsUsed,
              limit,
              nextResetAt: resetDate.toISOString(),
            }),
          };
        }
        
        console.log('   usage check passed:', `${generationsUsed + 1}/${limit}`);
      } else {
        // User authenticated but no entitlements doc - create one
        console.log('   creating entitlements for new user:', userId);
        const now = new Date();
        const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await userRef.set({
          tier: 'free',
          status: 'active',
          generationsUsed: 0,
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
      'You are a nutrition-aware meal planner. You generate realistic, well-known meals based on available ingredients. Only suggest real recipes that exist in cookbooks or are commonly made. You must return ONLY valid JSON.';

    const userPrompt =
      'Given these available ingredients:\n' +
      ingredients.map((x) => `- ${x}`).join('\n') +
      `\n\nUser goal: ${normalizedGoal}` +
      `\nDietary filters: ${normalizedFilters.length ? normalizedFilters.join(', ') : 'none'}` +
      '\n\nReturn ONLY JSON with this exact shape:' +
      '\n{' +
      '"meals": [' +
      '{"id": string, "name": string, "description": string, "prepTime": string, "difficulty": "Easy"|"Medium"|"Hard", "healthScore": number, "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": string[]}' +
      ']}' +
      '\n\nRules:' +
      '\n- Generate exactly 5 meals.' +
      '\n- Only suggest real, well-known recipes that actually exist (e.g., "Chicken Stir-Fry", "Spaghetti Carbonara", "Greek Salad"). Do NOT invent creative fusion dishes or made-up meal names.' +
      '\n- Meals should mostly use the provided ingredients; you may add up to 3 common pantry staples per meal (salt, pepper, oil, water, etc.).' +
      '\n- calories/protein/carbs/fat should be plausible estimates (integers, in grams for macros).' +
      '\n- healthScore must be an integer between 0-100 (where 100 is extremely healthy, 70-85 is moderately healthy, below 70 is less healthy).' +
      '\n- Keep prepTime like "25 min".' +
      '\n- No markdown, no extra keys.';

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
      .slice(0, 5)
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
        generationsUsed: admin.firestore.FieldValue.increment(1),
      });
      console.log('   incremented usage counter for user:', userId);
    }
    
    return successResponse({ meals: sanitized });
  } catch (error) {
    console.error('❌ /api/meals failed:', error);
    return errorResponse('Meal generation failed', 500, error?.message || String(error));
  }
}
