# 🚀 PlatelyAI - Easy Deployment Guide (First Time!)

This is the **simplest** way to deploy PlatelyAI. We'll use:
- **Render.com** (free) for backend
- **Netlify** (free) for frontend

⏱️ Total time: **15-20 minutes**

---

## 📋 Prerequisites

You need accounts for these services (all free):
1. ✅ [GitHub account](https://github.com) - to host your code
2. ✅ [Render account](https://render.com) - for backend server
3. ✅ [Netlify account](https://netlify.com) - for frontend website
4. ✅ Firebase project (you already have this)
5. ✅ OpenAI API key (you already have this)
6. ✅ Cloudinary account (you already have this)
7. ✅ Stripe account (you already have this)

---

## Step 1: Push Your Code to GitHub

Your code is currently only on your computer. Let's push it to GitHub so Render and Netlify can access it.

### 1.1 Clean up any uncommitted changes
```powershell
cd c:\Users\timlu\OneDrive\Desktop\PlatelyAIFolder
git status
```

If you see files listed, add them:
```powershell
git add .
git commit -m "Prepare for deployment"
```

### 1.2 Push to GitHub
```powershell
git push origin main
```

✅ **Checkpoint:** Go to your GitHub repository in a browser. You should see all your files there.

---

## Step 2: Deploy Backend to Render.com

### 2.1 Create New Web Service

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** button → **"Web Service"**
3. Click **"Connect GitHub"** (if first time, authorize Render to access your repos)
4. Find your `PlatelyAI` repository and click **"Connect"**

### 2.2 Configure the Web Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `platelyai-backend` (or any name you like) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ IMPORTANT! |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.3 Add Environment Variables

Scroll down to **"Environment Variables"** section. Click **"Add Environment Variable"** for each of these:

**⚠️ IMPORTANT: Use YOUR actual values from your backend/.env file!**

```env
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-3
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
STRIPE_SECRET_KEY=sk_test_or_sk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_PREMIUM_PRICE_ID=price_YOUR_PRICE_ID
FRONTEND_URL=https://your-netlify-site.netlify.app
```

⚠️ **IMPORTANT:** For `FRONTEND_URL`, we'll update this later once we have the Netlify URL. For now, put a placeholder like `https://platelyai.netlify.app`

### 2.4 Deploy!

Click **"Create Web Service"** at the bottom.

Render will now:
1. Clone your repo
2. Install dependencies
3. Start your backend server

⏱️ This takes 2-3 minutes. Watch the logs to see progress.

✅ **Checkpoint:** When you see "Your service is live 🎉", copy the URL. It will look like: `https://platelyai-backend.onrender.com`

**Save this URL!** You'll need it for the next step.

---

## Step 3: Deploy Frontend to Netlify

### 3.1 Connect to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Find your `PlatelyAI` repository and click it

### 3.2 Configure Build Settings

| Setting | Value |
|---------|-------|
| **Branch to deploy** | `main` |
| **Base directory** | (leave empty) |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |

### 3.3 Add Environment Variables

Click **"Add environment variables"** and add these:

```env
VITE_BACKEND_URL=https://platelyai-backend.onrender.com
VITE_FIREBASE_API_KEY=AIzaSyBXSg8zq9Z9qwZ9qwZ9qwZ9qwZ9qwZ9qwZ
VITE_FIREBASE_AUTH_DOMAIN=platelyai-45b5e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=platelyai-45b5e
VITE_FIREBASE_STORAGE_BUCKET=platelyai-45b5e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51So8RrQgbzXXihIUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT:** 
- Replace `VITE_BACKEND_URL` with YOUR Render backend URL from Step 2.4
- Get the real Firebase client config from [Firebase Console](https://console.firebase.google.com) → Your Project → Project Settings → Your Apps
- Get Stripe publishable key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

### 3.4 Deploy!

Click **"Deploy site"**

⏱️ This takes 1-2 minutes.

✅ **Checkpoint:** When done, you'll see your site URL like `https://rainbow-unicorn-123abc.netlify.app`

---

## Step 4: Update FRONTEND_URL in Render

Now that you have your Netlify URL, go back to Render:

1. Go to your backend service in Render dashboard
2. Click **"Environment"** in the left sidebar
3. Find `FRONTEND_URL` variable
4. Edit it and paste your Netlify URL: `https://rainbow-unicorn-123abc.netlify.app`
5. Click **"Save Changes"**

Your backend will automatically redeploy (takes 1-2 mins).

---

## Step 5: Configure Stripe Webhook

Your backend needs to receive webhook events from Stripe for subscription updates.

### 5.1 Add Webhook Endpoint in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your Render backend URL + `/api/stripe-webhook`:
   ```
   https://platelyai-backend.onrender.com/api/stripe-webhook
   ```
4. Click **"Select events"** and add these:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **"Add endpoint"**

### 5.2 Update Webhook Secret

1. Click on the webhook you just created
2. Click **"Reveal"** under "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Go back to Render → Your backend → Environment
5. Update `STRIPE_WEBHOOK_SECRET` with the new secret
6. Save changes (backend will redeploy)

---

## 🎉 You're Live!

Your app is now fully deployed!

- **Frontend:** `https://your-site.netlify.app`
- **Backend:** `https://your-backend.onrender.com`

### Test it:
1. Open your Netlify URL in a browser
2. Try uploading a fridge photo
3. Generate meals
4. Try the upgrade flow (use Stripe test cards)

---

## 📝 Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- This is normal! Just wait for it to wake up.

**Netlify Free Tier:**
- 100GB bandwidth/month
- Should be plenty for your MVP

### How to Update Your App

Whenever you make code changes:

```powershell
git add .
git commit -m "Your update message"
git push origin main
```

Both Render and Netlify will automatically detect the changes and redeploy!

---

## 🆘 Troubleshooting

### Backend won't start
- Check Render logs: Click your service → "Logs" tab
- Common issues:
  - Missing environment variables
  - Wrong `Root Directory` (should be `backend`)
  - Wrong `Start Command` (should be `npm start`)

### Frontend shows errors
- Check browser console (F12)
- Common issues:
  - `VITE_BACKEND_URL` pointing to wrong URL
  - Missing Firebase config variables
  - Backend is sleeping (wait 60 seconds)

### Stripe payments don't work
- Make sure you're using test keys in test mode
- Check webhook secret is correct
- Verify webhook URL is correct

---

## 🚀 Next Steps

1. **Get Real Firebase Config:** Go to Firebase Console and get your actual client config values
2. **Get Stripe Keys:** Get your test/live publishable keys from Stripe Dashboard
3. **Custom Domain:** 
   - Netlify: Settings → Domain management → Add custom domain
   - Render: Settings → Custom domain
4. **Monitoring:** Check Render logs regularly to see usage patterns

---

Need help? Check:
- Render logs: Your service → Logs tab
- Netlify logs: Deploys → Click latest deploy → Deploy log
- Browser console: F12 → Console tab
