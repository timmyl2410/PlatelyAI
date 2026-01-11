// Netlify Function: POST /api/scan -> /.netlify/functions/scan
// Scans images to detect foods using OpenAI Vision API

import { parseJsonFromModel, OPENAI_MODEL, corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { imageUrls } = body;

    console.log('🧠 /api/scan called');
    console.log('   imageUrls:', Array.isArray(imageUrls) ? imageUrls.length : 'not-an-array');

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return errorResponse('Missing imageUrls (array)', 400);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = OPENAI_MODEL;

    console.log('   model:', model);
    console.log('   apiKey set:', Boolean(apiKey));

    if (!apiKey) {
      return errorResponse('OPENAI_API_KEY not set', 500, 'Add OPENAI_API_KEY to Netlify environment variables');
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
      return errorResponse('Vision model request failed', 502, data);
    }

    const text = data?.choices?.[0]?.message?.content;
    const parsed = parseJsonFromModel(text);

    if (Array.isArray(parsed?.foods)) {
      console.log('   foods detected:', parsed.foods.length);
    }

    if (!parsed || !Array.isArray(parsed.foods)) {
      return errorResponse('Model returned unexpected output', 502, { raw: text });
    }

    // Basic sanitation
    const foods = parsed.foods
      .filter((f) => f && typeof f.name === 'string' && typeof f.category === 'string')
      .map((f) => ({ name: f.name.trim(), category: f.category.trim() }));

    return successResponse({ foods });
  } catch (error) {
    console.error('❌ /api/scan failed:', error);
    return errorResponse('Scan failed', 500, error?.message || String(error));
  }
}
