# PlatelyAI Deployment Checklist

## ✅ Code Review Complete
All hardcoded URLs have been replaced with dynamic ones that will work with myplately.com

## 📋 Pre-Deployment Checklist

### 1. Environment Variables - Frontend
Create these in your hosting platform (Vercel/Netlify/etc.):
```env
VITE_BACKEND_URL=https://api.myplately.com (or your backend URL)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
VITE_STRIPE_PREMIUM_PRICE_ID=price_your_price_id_here
```

### 2. Environment Variables - Backend
Create these in your backend hosting (Render/Railway/etc.):
```env
# Required
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PREMIUM_PRICE_ID=price_your_price_id_here

# Important!
FRONTEND_URL=https://myplately.com
```

### 3. Firebase Configuration
Update in Firebase Console:
- **Authorized domains**: Add `myplately.com` to Authentication > Settings > Authorized domains
- **OAuth redirect URIs**: Update in Google Cloud Console if using Google Sign-In

### 4. Stripe Configuration
In Stripe Dashboard:
- Create production webhook: `https://myplately.com/api/stripe-webhook`
- Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy webhook secret to backend environment variables
- Switch from test mode to live mode

### 5. Domain Configuration
- Point `myplately.com` to your frontend hosting
- Point `api.myplately.com` (or subdomain) to your backend hosting
- Ensure SSL/HTTPS is enabled (usually automatic with Vercel/Netlify)

## 🚀 Deployment Steps

### Frontend (Vercel/Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables
5. Deploy!

### Backend (Render/Railway/Heroku)
1. Connect GitHub repository
2. Set start command: `npm start` or `node server.js`
3. Add environment variables
4. Deploy!

## ✅ Post-Deployment Testing

### Test Free Features:
- [ ] Sign up with email/password
- [ ] Sign in with Google (if configured)
- [ ] Upload fridge/pantry images
- [ ] Generate meals (5 per day limit)
- [ ] View results

### Test Premium Features:
- [ ] Click "Upgrade to Premium"
- [ ] Complete Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Verify automatic upgrade after payment
- [ ] Test unlimited meal generation
- [ ] Test meal images
- [ ] Test full macros

### Test Mobile Features:
- [ ] QR code generation works with correct domain
- [ ] Mobile upload page works
- [ ] Images sync properly

## 🔍 What Changed

### Fixed Hardcoded URLs:
- **UploadPage.tsx**: QR codes now use `window.location.origin` (will be https://myplately.com)
- **All other components**: Already using environment variables

### Stripe Integration:
- Backend has full Stripe checkout and webhook handlers
- Frontend automatically uses Stripe when keys are configured
- Falls back to DEV mode if no Stripe keys

### Environment-Based Behavior:
- Development: Uses localhost URLs
- Production: Uses your domain URLs automatically

## 📝 Notes

- `.env` files are gitignored ✅
- All sensitive keys stay in environment variables ✅
- URLs adapt automatically to deployment environment ✅
- Stripe webhook must be configured in production for payments to work
- Until Stripe webhook is set up, use DEV mode upgrade button for testing

## 🆘 If Something Breaks

### "Failed to fetch" errors:
- Check VITE_BACKEND_URL in frontend env vars
- Check CORS settings in backend (should allow your domain)
- Verify backend is deployed and running

### Stripe not working:
- Verify all Stripe keys are in backend env vars
- Check webhook is configured with production URL
- Check webhook secret matches

### Firebase auth not working:
- Add myplately.com to authorized domains
- Update OAuth redirect URIs
- Verify Firebase keys are correct

### Images not loading:
- Check Cloudinary keys (if using)
- Check Firebase Storage rules
- Verify OPENAI_API_KEY for meal images

---

**Ready to deploy!** All code is production-ready. Just add your environment variables and configure your domain. 🚀
