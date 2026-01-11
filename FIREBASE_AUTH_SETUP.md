# Firebase Authentication Setup Guide

Your authentication system is now fully integrated with Firebase! Follow these steps to enable authentication in your Firebase Console.

## Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **platelyai-45b5e**
3. In the left sidebar, click **Build** → **Authentication**
4. Click **Get Started** (if this is your first time)

## Step 2: Enable Email/Password Authentication

1. Click on the **Sign-in method** tab
2. Click on **Email/Password** in the providers list
3. Toggle **Enable** to ON
4. Click **Save**

✅ **You can now sign up and sign in with email/password!**

## Step 3: Enable Google Authentication (Optional)

1. Still in **Sign-in method** tab, click on **Google**
2. Toggle **Enable** to ON
3. **Web SDK configuration:**
   - Project support email: Enter your email (e.g., timmy@platelyai.com)
4. Click **Save**

### Additional Google OAuth Setup (for production):
- For local development (localhost), Google sign-in works immediately
- For production domains:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Select your Firebase project
  3. Navigate to **APIs & Services** → **Credentials**
  4. Click your OAuth 2.0 Client ID (auto-created by Firebase)
  5. Under **Authorized JavaScript origins**, add your production URL:
     - `https://yourdomain.com`
  6. Under **Authorized redirect URIs**, add:
     - `https://yourdomain.com/__/auth/handler`

## Step 4: Enable GitHub Authentication (Optional)

GitHub sign-in requires a GitHub OAuth App. Follow these steps:

### Create GitHub OAuth App:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the form:
   - **Application name:** MealMakerAI
   - **Homepage URL:** 
     - Dev: `http://localhost:5173`
     - Prod: `https://yourdomain.com`
   - **Authorization callback URL:** 
     - Get this from Firebase Console (see below)
   - **Application description:** (optional) "Meal planning app for athletes"
4. Click **Register application**
5. On the next page, you'll see:
   - **Client ID** (copy this)
   - Click **Generate a new client secret** (copy this too)

### Configure Firebase with GitHub credentials:
1. Back in Firebase Console, **Sign-in method** tab
2. Click on **GitHub**
3. Toggle **Enable** to ON
4. Paste your **Client ID** and **Client secret** from GitHub
5. Copy the **Authorization callback URL** shown in Firebase
6. Go back to your GitHub OAuth App settings and paste this URL as the **Authorization callback URL**
7. Click **Save** in Firebase Console

✅ **GitHub sign-in is now enabled!**

## Step 5: Configure Authorized Domains

By default, Firebase allows authentication from:
- `localhost` (for development)
- Your Firebase hosting domain (`platelyai-45b5e.firebaseapp.com`)

To add your custom domain:
1. In Firebase Console, go to **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Click **Add domain**
4. Enter your production domain (e.g., `platelyai.com`)
5. Click **Add**

## Step 6: Test Your Authentication

### Email/Password Sign Up:
1. Run your app: `npm run dev`
2. Go to [http://localhost:5173/signup](http://localhost:5173/signup)
3. Enter your name, email, and password
4. Click **Create Account**
5. ✅ You should be signed in and redirected to the home page!

### Sign In:
1. Go to [http://localhost:5173/signin](http://localhost:5173/signin)
2. Enter the email and password you just created
3. Click **Sign In**
4. ✅ You should be signed in!

### Google Sign In (after enabling):
1. On Sign In or Sign Up page, click **Continue with Google**
2. Select your Google account
3. ✅ You should be signed in!

### Check Firebase Console:
1. Go to **Authentication** → **Users** tab
2. You should see all users who have signed up!

## Security Rules (Optional but Recommended)

After authentication is working, consider setting up Firestore security rules:

### Basic Firestore Rules (authenticated users only):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Meals are accessible to their creator
    match /meals/{mealId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

To update rules:
1. Go to **Firestore Database** → **Rules** tab
2. Paste the rules above
3. Click **Publish**

## Troubleshooting

### "auth/configuration-not-found" Error
- Make sure you've enabled the authentication provider in Firebase Console
- Wait a few minutes for changes to propagate

### Google Sign-In Popup Blocked
- Check browser settings to allow popups from localhost
- Some browsers block popups by default

### "auth/unauthorized-domain" Error
- Add your domain to **Authorized domains** in Firebase Console
- For localhost, this should already be configured

### Password Too Weak
- Firebase requires passwords to be at least 6 characters
- Your app enforces 8 characters minimum (stricter)

### Email Already in Use
- User already signed up with that email
- Try signing in instead, or use forgot password

## What's Next?

Your authentication is now fully functional! Here are some next steps:

1. **Password Reset:** Already implemented! Users can reset their password from the Forgot Password page
2. **Account Management:** Users can update their profile and change passwords from the Account page
3. **Protected Routes:** Consider adding route protection to require authentication for certain pages
4. **User Profiles in Firestore:** Store additional user data (preferences, meal history) in Firestore
5. **Email Verification:** Add email verification for new accounts (Firebase provides this)

## Important Notes

- 🔒 **Never commit your Firebase config to public repos** (it's already in your code, which is fine for Firebase client config)
- 🔑 **Keep your OAuth secrets safe** (never expose Client Secrets in frontend code)
- ✅ **Firebase handles secure password hashing** (you don't need to worry about password storage)
- 🛡️ **Firebase Authentication is production-ready** (used by millions of apps)

---

**All authentication code has been updated and is ready to use once you enable the providers in Firebase Console!**
