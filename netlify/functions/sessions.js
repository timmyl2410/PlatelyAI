// Netlify Function: GET /api/sessions -> /.netlify/functions/sessions
// Creates a new session ID and stores it in Firestore

import { v4 as uuidv4 } from 'uuid';
import { getFirestore, admin } from './_lib/firebaseAdmin.js';
import { corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const sessionId = uuidv4();
    const firestore = getFirestore();

    // Store session in Firestore instead of in-memory
    await firestore.collection('sessions').doc(sessionId).set({
      id: sessionId,
      createdAt: admin.firestore.Timestamp.now(),
      images: [],
    });

    console.log(`✅ Session created: ${sessionId}`);
    return successResponse({ sessionId });
  } catch (error) {
    console.error('Session creation error:', error);
    return errorResponse('Failed to create session', 500, error.message);
  }
}
