// Netlify Function: POST /api/scan -> /.netlify/functions/scan
// Scans images to detect foods using OpenAI Vision API

import { getFirestore, admin } from './_lib/firebaseAdmin.js';
import { parseJsonFromModel, OPENAI_MODEL, corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  const db = getFirestore();
  const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let scanRunRef = null;

  try {
    const body = JSON.parse(event.body || '{}');
    const { imageUrls, userId } = body;

    console.log('🧠 /api/scan called');
    console.log('   imageUrls:', Array.isArray(imageUrls) ? imageUrls.length : 'not-an-array');
    console.log('   userId:', userId || 'not-provided');

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return errorResponse('Missing imageUrls (array)', 400);
    }

    // Create scan run document if userId provided
    if (userId) {
      scanRunRef = db.doc(`scans/${userId}/runs/${scanId}`);
      await scanRunRef.set({
        status: 'processing',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        imageCount: imageUrls.length,
      });
      console.log(`   📝 Created scan run: scans/${userId}/runs/${scanId}`);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = OPENAI_MODEL;

    console.log('   model:', model);
    console.log('   apiKey set:', Boolean(apiKey));

    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY not set in Netlify environment');
      console.error('   To fix: Add OPENAI_API_KEY in Netlify Dashboard > Site settings > Environment variables');
      console.error('   Current env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
      return errorResponse(
        'OPENAI_API_KEY not set', 
        500, 
        'Add OPENAI_API_KEY to Netlify environment variables in your dashboard'
      );
    }

    // Log success (without exposing the key)
    console.log('   ✅ OpenAI key detected (length:', apiKey.length, ')');

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

    // Update scan run to done
    if (scanRunRef) {
      await scanRunRef.update({
        status: 'done',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        extractedCount: foods.length,
      });
      console.log(`   ✅ Scan run completed: ${foods.length} foods extracted`);
    }

    return successResponse({ foods, scanId });
  } catch (error) {
    console.error('❌ /api/scan failed:', error);

    // Update scan run to failed
    if (scanRunRef) {
      try {
        await scanRunRef.update({
          status: 'failed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: error?.message || String(error),
        });
      } catch (updateError) {
        console.error('Failed to update scan run status:', updateError);
      }
    }

    return errorResponse('Scan failed', 500, error?.message || String(error));
  }
}
