// Netlify Function: POST /api/stripe-webhook -> /.netlify/functions/stripe-webhook
// Handles Stripe webhook events for subscription management
// IMPORTANT: Requires raw body for signature verification

import { getStripeClient } from './_lib/stripe.js';
import { getFirestore } from './_lib/firebaseAdmin.js';
import { corsHeaders } from './_lib/helpers.js';

export async function handler(event, context) {
  // Stripe webhooks don't send OPTIONS, but handle it just in case
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not set');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Stripe webhook secret not configured',
    };
  }

  let stripeEvent;

  try {
    const stripe = getStripeClient();
    // In Netlify Functions, event.body is a string (raw body)
    // Stripe requires the exact raw body for signature verification
    const rawBody = event.body;
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: `Webhook Error: ${err.message}`,
    };
  }

  // Handle the event
  try {
    const db = getFirestore();

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const userId = session.metadata?.userId;

        if (userId) {
          console.log(`✓ Payment successful for user ${userId}`);
          
          // Get subscription details to fetch currentPeriodEnd
          let currentPeriodEnd = null;
          if (session.subscription) {
            const stripe = getStripeClient();
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          }
          
          // Update user tier in Firestore
          await db.collection('userEntitlements').doc(userId).set(
            {
              tier: 'premium',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: 'active',
              currentPeriodEnd: currentPeriodEnd,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          console.log(`✓ User ${userId} upgraded to premium`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;
        const customerId = subscription.customer;

        // Find user by Stripe customer ID
        const snapshot = await db
          .collection('userEntitlements')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const status = subscription.status;

          // Update tier based on subscription status
          const tier = status === 'active' ? 'premium' : 'free';
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          
          await doc.ref.update({
            tier: tier,
            subscriptionStatus: status,
            currentPeriodEnd: currentPeriodEnd,
            updatedAt: new Date().toISOString(),
          });

          console.log(`✓ Subscription updated for ${doc.id}: ${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const customerId = subscription.customer;

        // Find user by Stripe customer ID
        const snapshot = await db
          .collection('userEntitlements')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          await doc.ref.update({
            tier: 'free',
            subscriptionStatus: 'canceled',
            updatedAt: new Date().toISOString(),
          });

          console.log(`✓ Subscription canceled for ${doc.id}, downgraded to free`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Webhook handler failed' }),
    };
  }
}
