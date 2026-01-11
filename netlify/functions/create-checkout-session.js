// Netlify Function: POST /api/create-checkout-session -> /.netlify/functions/create-checkout-session
// Creates a Stripe checkout session for subscription payments

import { getStripeClient } from './_lib/stripe.js';
import { corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const stripe = getStripeClient();
    const body = JSON.parse(event.body || '{}');
    const { userId, userEmail, priceId } = body;

    if (!userId || !priceId) {
      return errorResponse('Missing userId or priceId', 400);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail || undefined,
      line_items: [
        {
          price: priceId || process.env.STRIPE_PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'https://myplately.com'}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://myplately.com'}/pricing`,
      metadata: {
        userId: userId,
      },
    });

    return successResponse({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('❌ Create checkout session failed:', error);
    return errorResponse('Failed to create checkout session', 500, error?.message);
  }
}
