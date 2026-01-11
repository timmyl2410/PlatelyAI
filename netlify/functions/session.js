// Netlify Function: GET /api/session/:sessionId -> /.netlify/functions/session
// Returns all images for a session from Firestore

import { getFirestore } from './_lib/firebaseAdmin.js';
import { corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Extract sessionId from path or query string
    const pathParts = event.path.split('/');
    const sessionId = pathParts[pathParts.length - 1] || event.queryStringParameters?.sessionId;

    if (!sessionId) {
      return errorResponse('Missing sessionId', 400);
    }

    const firestore = getFirestore();
    const sessionDoc = await firestore.collection('sessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      return errorResponse('Session not found', 404);
    }

    const sessionData = sessionDoc.data();
    return successResponse(sessionData);
  } catch (error) {
    console.error('Session retrieval error:', error);
    return errorResponse('Failed to retrieve session', 500, error.message);
  }
}
