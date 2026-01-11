# Stripe Payment Integration Setup Guide

## Prerequisites
You mentioned you have Stripe API keys. You'll need:
- **Stripe Secret Key** (starts with `sk_test_` or `sk_live_`)
- **Stripe Publishable Key** (starts with `pk_test_` or `pk_live_`)
- **Stripe Webhook Secret** (starts with `whsec_`)

## Step 1: Install Stripe Package

Run this in the `backend` folder:
```bash
cd backend
npm install stripe
```

## Step 2: Add Stripe Keys to .env

Add these to `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

Add this to the root `.env` file:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Step 3: Create Stripe Products

In your Stripe Dashboard (https://dashboard.stripe.com):
1. Go to Products > Add Product
2. Create a product called "PlatelyAI Premium"
3. Set price to $9.99/month (or your preferred price)
4. Set it as a recurring subscription
5. Copy the **Price ID** (starts with `price_`)

Add to `backend/.env`:
```env
STRIPE_PREMIUM_PRICE_ID=price_your_price_id_here
```

## Step 4: Set Up Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Set URL to: `https://your-domain.com/api/stripe-webhook` (or `http://localhost:5000/api/stripe-webhook` for testing)
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook Secret** and add it to your `.env`

## Step 5: Testing Locally

For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:5000/api/stripe-webhook
```

This will give you a webhook secret starting with `whsec_` - use this in your `.env`

## Step 6: Restart Backend

After adding all environment variables:
```bash
cd backend
npm run dev
```

## Summary

The integration will:
- Create Stripe checkout sessions when users click "Upgrade to Premium"
- Redirect users to Stripe's secure payment page
- Handle successful payments via webhook
- Automatically upgrade user tier in Firestore
- Handle subscription cancellations

All payment processing happens on Stripe's secure servers - no credit card data touches your backend.
