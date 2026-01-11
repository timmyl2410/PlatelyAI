// Shared helper functions for Netlify Functions
// These are backend utilities and should never be imported by frontend code

export const parseJsonFromModel = (text) => {
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

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// OpenAI model configuration
// Read from environment to avoid secrets scanning detection
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
export const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'dall-e-3';

// Limit concurrent image generations
const MAX_PARALLEL_IMAGE_GENERATIONS = Math.max(
  1,
  Number.parseInt(process.env.MAX_PARALLEL_IMAGE_GENERATIONS || '1', 10) || 1
);

let imageGenAvailable = MAX_PARALLEL_IMAGE_GENERATIONS;
const imageGenWaiters = [];

export const acquireImageGenSlot = async () => {
  if (imageGenAvailable > 0) {
    imageGenAvailable -= 1;
    return;
  }
  await new Promise((resolve) => imageGenWaiters.push(resolve));
};

export const releaseImageGenSlot = () => {
  const next = imageGenWaiters.shift();
  if (next) {
    next();
    return;
  }
  imageGenAvailable = Math.min(MAX_PARALLEL_IMAGE_GENERATIONS, imageGenAvailable + 1);
};

export const extractBase64Image = (openAiImagesResponse) => {
  const firstData = openAiImagesResponse?.data?.[0];
  if (!firstData) return null;
  return firstData.b64_json || null;
};

// CORS headers for Netlify Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Handle OPTIONS preflight
export const handleOptions = () => ({
  statusCode: 204,
  headers: corsHeaders,
  body: '',
});

// Success response helper
export const successResponse = (data, statusCode = 200) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(data),
});

// Error response helper
export const errorResponse = (message, statusCode = 500, details = null) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify({ error: message, ...(details && { details }) }),
});
