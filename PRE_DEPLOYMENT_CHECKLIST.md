# ✅ Pre-Deployment Checklist

Before deploying, make sure you have these items ready:

## 🔑 API Keys & Credentials

### 1. Firebase Configuration
- [ ] Firebase Project ID: `platelyai-45b5e`
- [ ] Firebase Client Email (from service account JSON)
- [ ] Firebase Private Key (from service account JSON)
- [ ] Firebase Storage Bucket: `platelyai-45b5e.firebasestorage.app`
- [ ] Firebase Web Client Config (API Key, Auth Domain, etc.) - Get from Firebase Console > Project Settings > Your Apps

### 2. OpenAI
- [ ] API Key: `sk-proj-bhSw...` (you have this)
- [ ] Model: `gpt-4o-mini` ✅
- [ ] Image Model: `dall-e-3` ✅

### 3. Cloudinary
- [ ] Cloud Name: `dmr52hoop` ✅
- [ ] API Key: `248657819138829` ✅
- [ ] API Secret: `IDkoOZ2...` ✅

### 4. Stripe
- [ ] Secret Key (starts with `sk_test_` or `sk_live_`)
- [ ] Webhook Secret (starts with `whsec_`) - You'll get this after setting up webhook
- [ ] Premium Price ID (starts with `price_`)
- [ ] Publishable Key (starts with `pk_test_` or `pk_live_`) - For frontend

## 📝 What You Need to Update

### In Your Root `.env` file:
Replace these placeholder values with REAL values from Firebase Console:
```
VITE_FIREBASE_API_KEY=AIzaSyBXSg8zq9Z9qwZ9qwZ9qwZ9qwZ9qwZ9qwZ   # ← GET REAL VALUE
VITE_FIREBASE_AUTH_DOMAIN=platelyai-45b5e.firebaseapp.com       # ← Probably correct
VITE_FIREBASE_PROJECT_ID=platelyai-45b5e                         # ✅ Correct
VITE_FIREBASE_STORAGE_BUCKET=platelyai-45b5e.firebasestorage.app # ✅ Correct
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012                   # ← GET REAL VALUE
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890         # ← GET REAL VALUE
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX                        # ← GET REAL VALUE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51So8RrQgbzXXihIU...         # ← GET REAL VALUE
VITE_STRIPE_PREMIUM_PRICE_ID=price_...                           # ← GET REAL VALUE
```

To get these:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `platelyai-45b5e`
3. Click the gear icon → Project Settings
4. Scroll down to "Your apps" section
5. If you don't see a web app, click "Add app" → Web
6. Copy all the config values

### Backend `.env` is Already Complete! ✅
Your `backend/.env` has all the real values already configured.

## 🚀 Ready to Deploy?

Once you have the Firebase client config values:

1. **Update the root `.env` file** with real Firebase values
2. **Follow the `EASY_DEPLOYMENT_GUIDE.md`** step by step
3. **Start with Step 1:** Push to GitHub
4. **Step 2:** Deploy backend to Render
5. **Step 3:** Deploy frontend to Netlify

## 📦 What's Already Configured

✅ Backend server ready (`backend/server.js`)
✅ Backend environment variables complete (`backend/.env`)
✅ Frontend uses `VITE_BACKEND_URL` for API calls
✅ Build succeeds (tested: `npm run build`)
✅ Git ignores `.env` files (secrets safe)
✅ Example `.env` files created for reference
