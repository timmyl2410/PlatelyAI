// Netlify Function: GET /.netlify/functions/health
// Health check endpoint to verify API connectivity

import { corsHeaders, handleOptions, successResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  return successResponse({
    ok: true,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.CONTEXT || 'unknown',
    functions: [
      'scan',
      'categorize-food',
      'meals',
      'upload',
      'session',
      'sessions',
      'create-checkout-session',
      'create-billing-portal-session',
      'stripe-webhook',
    ],
  });
}
