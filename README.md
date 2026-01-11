
  # PlatelyAI

  This is a code bundle for PlatelyAI. The original project is available at https://www.figma.com/design/UYnP98xZxOWT3ZMd0Hj9pt/PlatelyAI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  ## Subscription Tiers & Feature Gating

  PlatelyAI implements a comprehensive subscription system with three tiers:

  ### Tiers
  
  - **Free**: 25 meal generations per month, basic features only
  - **Premium**: $6.99/month, 150 generations, includes meal images, full macro breakdowns, and recipe links
  - **Pro**: Coming soon (waitlist available), 500 generations, all Premium features + advanced personalization
  
  ### Architecture
  
  #### Entitlements Model (`src/lib/entitlements.ts`)
  - Defines tier limits, pricing, and feature flags
  - Provides feature gating functions: `canGenerateMeal()`, `canSeeImages()`, `canSeeFullMacros()`, `canSeeRecipeLinks()`
  - Handles monthly reset logic and usage calculations
  
  #### Firestore Integration (`src/lib/firestoreUsers.ts`)
  - Manages user entitlements in Firestore `users/{uid}` collection
  - Tracks: `tier`, `status`, `generationsUsed`, `nextResetAt`, `lastResetAt`
  - Pro waitlist stored in `pro_waitlist/{uid}` collection
  - Atomic counter increments for usage tracking
  
  #### Backend Enforcement (`backend/server.js`)
  - `/api/meals` endpoint checks usage limits before generation
  - Authenticates requests via Firebase Auth tokens
  - Returns `403 LIMIT_REACHED` when monthly limit exhausted
  - Automatically resets usage on 1st of each month
  - Increments usage counter after successful generation
  
  #### UI Components
  - `LockedFeature.tsx`: Shows lock icon for gated features
  - `UpgradeModal.tsx`: Prompts users to upgrade (limit reached or premium feature)
  - `UsageDisplay.tsx`: Shows current usage with progress bar in Header dropdown
  - `PricingPage.tsx`: 3-tier pricing cards with DEV mode upgrade
  
  #### Feature Gating in App
  - **LoadingPage**: Checks usage before meal generation, shows upgrade modal if limit reached
  - **ResultsPage**: 
    - Hides meal images for free users (shows locked overlay)
    - Hides full macro breakdown (shows calories only + upgrade prompt)
    - Disables recipe links (shows locked button)
  - **Header**: Shows usage counter in user menu dropdown
  
  ### Configuration
  
  **Change Tier Limits**: Edit `TIER_LIMITS` in `src/lib/entitlements.ts`
  ```typescript
  const TIER_LIMITS = {
    free: 25,      // Change to adjust free tier limit
    premium: 150,  // Change to adjust premium limit
    pro: 500,      // Change to adjust pro limit
  };
  ```
  
  **Change Pricing**: Edit `TIER_PRICES` in `src/lib/entitlements.ts`
  ```typescript
  const TIER_PRICES = {
    free: 0,
    premium: 6.99,  // Change to adjust premium price
    pro: null,      // Coming soon
  };
  ```
  
  ### DEV Mode Upgrade Flow
  
  The current implementation uses a **DEV mode** upgrade flow for testing:
  - Click "Upgrade Now" on PricingPage
  - Immediately updates Firestore `tier` to `premium`
  - No payment processor integration (Stripe placeholder)
  - Production implementation should integrate Stripe/payment gateway
  
  ### Monthly Reset Logic
  
  - Usage resets automatically on the 1st of each month
  - `nextResetAt` timestamp stored in Firestore
  - Backend checks `nextResetAt` before each generation
  - If `now >= nextResetAt`, resets `generationsUsed` to 0 and updates timestamps
  - Frontend checks reset logic when displaying usage
  
  ### Testing
  
  1. **Sign up** for a new account (starts as Free tier)
  2. **Generate meals** until you hit the limit (25 for free)
  3. **See upgrade modal** when limit is reached
  4. **Click locked features** in ResultsPage to trigger upgrade modal
  5. **Upgrade to Premium** via PricingPage (DEV mode instant upgrade)
  6. **Verify Premium features** unlocked: images, macros, recipes
  7. **Check usage display** in Header user menu dropdown  