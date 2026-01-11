// Stripe initialization for Netlify Functions
// Keep Stripe client separate to avoid re-initialization

import Stripe from 'stripe';

export const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not set in environment variables');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { 
    apiVersion: '2024-12-18.acacia' 
  });
};
