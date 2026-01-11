// Netlify Function: POST /api/meal-image -> /.netlify/functions/meal-image
// Generates or reuses meal images with intelligent matching

import { v4 as uuidv4 } from 'uuid';
import { getFirestore, getBucket, admin } from './_lib/firebaseAdmin.js';
import { computeRecipeImageId } from './_lib/recipeImageId.js';
import { 
  OPENAI_IMAGE_MODEL, 
  sleep, 
  acquireImageGenSlot, 
  releaseImageGenSlot,
  corsHeaders, 
  handleOptions, 
  successResponse, 
  errorResponse 
} from './_lib/helpers.js';

// Helper functions for image matching
const normalizeIngredient = (ingredient) => {
  return String(ingredient || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const calculateIngredientSimilarity = (ingredients1, ingredients2) => {
  const set1 = new Set(ingredients1.map(normalizeIngredient).filter(Boolean));
  const set2 = new Set(ingredients2.map(normalizeIngredient).filter(Boolean));
  
  if (set1.size === 0 || set2.size === 0) return 0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

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

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { title, keyIngredients } = body;

    if (typeof title !== 'string' || !title.trim()) {
      return errorResponse('Missing title (string)', 400);
    }
    if (!Array.isArray(keyIngredients)) {
      return errorResponse('Missing keyIngredients (string[])', 400);
    }

    // Try to find a similar existing meal image first
    const similarMatch = await findSimilarMealImage(keyIngredients);
    if (similarMatch) {
      console.log(`✅ Matched existing image for "${title}" (${Math.round(similarMatch.similarity * 100)}% similar to "${similarMatch.title}")`);
      return successResponse({
        recipeImageId: similarMatch.recipeImageId,
        imageUrl: similarMatch.imageUrl,
        matched: true,
        matchedTitle: similarMatch.title,
        similarity: similarMatch.similarity,
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const imageModel = OPENAI_IMAGE_MODEL;
    const fallbackImageModel = process.env.OPENAI_IMAGE_FALLBACK_MODEL || OPENAI_IMAGE_MODEL;
    
    if (!apiKey) {
      return errorResponse('OPENAI_API_KEY not set', 500, 'Add OPENAI_API_KEY to Netlify environment variables');
    }

    const { recipeImageId, signature } = computeRecipeImageId({ title, keyIngredients });
    const firestore = getFirestore();
    const bucket = getBucket();

    const docRef = firestore.collection('recipeImages').doc(recipeImageId);
    const imagePath = `meal-images/${recipeImageId}.png`;

    // Idempotency check with lease system
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
              keyIngredients: keyIngredients.slice(0, 12),
              imagePath,
              downloadUrl: null,
              leaseId,
              leaseExpiresAt: admin.firestore.Timestamp.fromMillis(nowMs + leaseMs),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
              lastError: admin.firestore.FieldValue.delete(),
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
        keyIngredients: keyIngredients.slice(0, 12),
        imagePath,
        downloadUrl: null,
        leaseId,
        leaseExpiresAt: admin.firestore.Timestamp.fromMillis(nowMs + leaseMs),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { done: false, iAmGenerator: true };
    });

    if (leaseResult?.done) {
      return successResponse({ recipeImageId, imageUrl: leaseResult.imageUrl });
    }

    if (!leaseResult?.iAmGenerator) {
      // Wait for other request to finish
      for (let attempt = 0; attempt < 12; attempt++) {
        const snap = await docRef.get();
        if (snap.exists) {
          const data = snap.data();
          if (data?.downloadUrl) {
            return successResponse({ recipeImageId, imageUrl: data.downloadUrl });
          }
          if (data?.lastError) {
            return errorResponse('Image generation previously failed', 502, data.lastError);
          }
        }
        await sleep(500);
      }
      return {
        statusCode: 202,
        headers: corsHeaders,
        body: JSON.stringify({
          recipeImageId,
          error: 'Image generation in progress. Please retry shortly.',
        }),
      };
    }

    const prompt = `High-quality realistic food photo of ${title.trim()}. Natural lighting, plated nicely, shallow depth of field. No text, no watermark.`;

    const makeOpenAiImageRequest = async (bodyObj) => {
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(bodyObj),
      });
      const data = await resp.json().catch(() => ({}));
      return { resp, data };
    };

    const requestOpenAiWithRetries = async (bodyObj) => {
      let attempt = 0;
      while (true) {
        const out = await makeOpenAiImageRequest(bodyObj);
        if (out.resp.ok) return out;
        
        const shouldRetry = out.resp.status === 429 || (out.resp.status >= 500 && out.resp.status <= 599);
        if (!shouldRetry || attempt >= 3) return out;
        
        const delayMs = Math.min(8000, 750 * Math.pow(2, attempt));
        await sleep(delayMs);
        attempt += 1;
      }
    };

    const tryRequest = async (model, includeResponseFormat) => {
      const bodyObj = {
        model,
        prompt,
        size: '1024x1024',
      };
      if (includeResponseFormat) bodyObj.response_format = 'b64_json';
      return requestOpenAiWithRetries(bodyObj);
    };

    // Concurrency limit
    await acquireImageGenSlot();

    let openAi;
    try {
      openAi = await tryRequest(imageModel, true);

      if (!openAi.resp.ok) {
        const msg = openAi?.data?.error?.message;
        const param = openAi?.data?.error?.param;
        if (typeof msg === 'string' && msg.toLowerCase().includes('unknown parameter') && param === 'response_format') {
          openAi = await tryRequest(imageModel, false);
        }
      }

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
            leaseId: admin.firestore.FieldValue.delete(),
            leaseExpiresAt: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch {}
      return errorResponse('Image generation request failed', 502, openAi.data);
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
            leaseId: admin.firestore.FieldValue.delete(),
            leaseExpiresAt: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch {}
      return errorResponse('Image API returned no usable image data', 502, openAi.data);
    }

    const file = bucket.file(imagePath);
    await file.save(buffer, {
      contentType: 'image/png',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '2036-01-01',
    });

    await docRef.set(
      {
        signature,
        title: title.trim(),
        keyIngredients: keyIngredients.slice(0, 12),
        imagePath,
        downloadUrl: signedUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        leaseId: admin.firestore.FieldValue.delete(),
        leaseExpiresAt: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return successResponse({ recipeImageId, imageUrl: signedUrl });
  } catch (error) {
    console.error('❌ /api/meal-image failed:', error);
    return errorResponse('Meal image failed', 500, error?.message || String(error));
  }
}
