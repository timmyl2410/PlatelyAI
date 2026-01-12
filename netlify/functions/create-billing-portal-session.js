// Netlify Function: POST /api/create-billing-portal-session -> /.netlify/functions/create-billing-portal-session
// Creates a Stripe billing portal session for subscription management

import { getStripeClient } from './_lib/stripe.js';
import { getFirestore } from './_lib/firebaseAdmin.js';
import { corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { userId } = body;

    if (!userId) {
      return errorResponse('Missing userId', 400);
    }

    // TODO: Verify Firebase Auth token from Authorization header
    // For now, we trust the userId from the client (should be verified in production)
    // Example:
    // const token = event.headers.authorization?.replace('Bearer ', '');
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // if (decodedToken.uid !== userId) {
    //   return errorResponse('Unauthorized', 403);
    // }

    // Get user's Stripe customer ID from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('userEntitlements').doc(userId).get();

    if (!userDoc.exists) {
      return errorResponse('User not found', 404);
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return errorResponse('No active subscription found', 404);
    }

    // Create Stripe billing portal session
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'https://myplately.com'}/account?tab=billing&updated=true`,
    });

    console.log(`✓ Billing portal session created for user ${userId}`);

    return successResponse({ 
      url: session.url 
    });

  } catch (error) {
    console.error('❌ Create billing portal session failed:', error);
    return errorResponse(
      'Failed to create billing portal session', 
      500, 
      error?.message
    );
  }
}
