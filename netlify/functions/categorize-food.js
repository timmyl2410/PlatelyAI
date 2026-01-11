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
