// Netlify Function: POST /api/categorize-food -> /.netlify/functions/categorize-food
// Categorizes a single food item using OpenAI

import { OPENAI_MODEL, corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { foodName } = body;

    console.log('🏷️  /api/categorize-food called');
    console.log('   foodName:', foodName);

    if (!foodName || typeof foodName !== 'string') {
      return errorResponse('Missing foodName (string)', 400);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TEXT_MODEL || OPENAI_MODEL;

    if (!apiKey) {
      return errorResponse('OPENAI_API_KEY not set', 500, 'Add OPENAI_API_KEY to Netlify environment variables');
    }

    const systemPrompt = 'You are categorizing food items for a food-tracking app. You must be accurate and logical.';
    
    const userPrompt = `Categorize this food item: "${foodName}"

Available categories:
- Produce (fruits, vegetables)
- Meat (beef, chicken, pork, fish, seafood, steak, etc.)
- Dairy (milk, cheese, yogurt, butter, cream)
- Grains (rice, pasta, bread, cereal, oats)
- Pantry (oils, spices, flour, sugar, canned goods)
- Frozen (frozen foods)
- Snacks (chips, crackers, cookies, candy)
- Beverages (drinks, liquids, soda, juice, coffee, tea)
- Condiments (sauces, dressings, ketchup, mayo)
- Other (if none of the above fit)

IMPORTANT: Steak is MEAT. Beef is MEAT. All proteins are MEAT.

Respond with ONLY the category name. No explanation. One word only.

Category:`;

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
      return errorResponse('Categorization request failed', 502, data);
    }

    const category = data?.choices?.[0]?.message?.content?.trim() || 'Other';
    
    // Validate the category is in the allowed list
    const validCategories = ['Produce', 'Meat', 'Dairy', 'Grains', 'Pantry', 'Frozen', 'Snacks', 'Beverages', 'Condiments', 'Other'];
    const finalCategory = validCategories.includes(category) ? category : 'Other';

    console.log('   category:', finalCategory);
    return successResponse({ category: finalCategory });
  } catch (error) {
    console.error('❌ /api/categorize-food failed:', error);
    return errorResponse('Categorization failed', 500, error?.message || String(error));
  }
}
