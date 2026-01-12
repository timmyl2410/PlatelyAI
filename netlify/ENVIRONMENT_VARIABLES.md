# Netlify Environment Variables Setup

These environment variables must be configured in your **Netlify Dashboard** → Site Settings → Environment Variables

⚠️ **These are SERVER-SIDE variables for Netlify Functions, not frontend VITE_ variables**

## Required for Stripe (Billing & Subscriptions)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://myplately.com
```

## Required for OpenAI (Meal Generation & Scanning)

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-3
```

## Required for Cloudinary (Image Uploads)

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Required for Firebase Admin (Server-side)

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note:** For `FIREBASE_PRIVATE_KEY`, the newlines should be literal `\n` characters in the environment variable value.

---

## How to Set These in Netlify:

1. Go to your Netlify site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Click **Add a variable**
4. Add each variable listed above
5. **Deploy** your site for changes to take effect

## Current Issue

The `create-billing-portal-session` function is getting a 502 error because:
- Either `STRIPE_SECRET_KEY` is not set in Netlify
- Or the user doesn't have a `stripeCustomerId` yet (they need to upgrade to Premium first)

The improved error messages in the function will now show which issue it is.
