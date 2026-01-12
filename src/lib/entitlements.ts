// PlatelyAI Entitlements & Feature Gating System

export type TierName = 'free' | 'premium' | 'pro';
export type TierStatus = 'active' | 'inactive';

export interface UserEntitlements {
  uid: string;
  tier: TierName;
  tierStatus: TierStatus;
  mealGenerationsUsed: number;
  mealGenerationsLimit: number;
  billingPeriodStart: Date;
  nextResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
  currentPeriodEnd?: string; // ISO date string from Stripe
  subscriptionStatus?: string; // Stripe subscription status
}

// Tier Configuration
export const TIER_LIMITS = {
  free: {
    mealGenerationsLimit: 30,
    canSeeImages: false,
    canSeeFullMacros: false,
    canSeeRecipeLinks: false,
    canUseAdvancedPersonalization: false,
  },
  premium: {
    mealGenerationsLimit: 150,
    canSeeImages: true,
    canSeeFullMacros: true,
    canSeeRecipeLinks: true,
    canUseAdvancedPersonalization: true,
  },
  pro: {
    // Future tier - not yet purchasable
    mealGenerationsLimit: 500,
    canSeeImages: true,
    canSeeFullMacros: true,
    canSeeRecipeLinks: true,
    canUseAdvancedPersonalization: true,
  },
};

export const TIER_PRICES = {
  free: 0,
  premium: 9.99,
  pro: null, // Coming soon
};

// Feature Gating Functions
export function canGenerateMeal(user: UserEntitlements | null): boolean {
  if (!user || user.tierStatus !== 'active') return false;
  return user.mealGenerationsUsed < user.mealGenerationsLimit;
}

export function canSeeImages(user: UserEntitlements | null): boolean {
  if (!user || user.tierStatus !== 'active') return false;
  return TIER_LIMITS[user.tier].canSeeImages;
}

export function canSeeFullMacros(user: UserEntitlements | null): boolean {
  if (!user || user.tierStatus !== 'active') return false;
  return TIER_LIMITS[user.tier].canSeeFullMacros;
}

export function canSeeRecipeLinks(user: UserEntitlements | null): boolean {
  if (!user || user.tierStatus !== 'active') return false;
  return TIER_LIMITS[user.tier].canSeeRecipeLinks;
}

export function canUseAdvancedPersonalization(user: UserEntitlements | null): boolean {
  if (!user || user.tierStatus !== 'active') return false;
  return TIER_LIMITS[user.tier].canUseAdvancedPersonalization;
}

export function getRemainingGenerations(user: UserEntitlements | null): number {
  if (!user || user.tierStatus !== 'active') return 0;
  return Math.max(0, user.mealGenerationsLimit - user.mealGenerationsUsed);
}

export function needsReset(user: UserEntitlements): boolean {
  return new Date() >= user.nextResetAt;
}

export function getNextResetDate(fromDate: Date = new Date()): Date {
  const next = new Date(fromDate);
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getTierDisplayName(tier: TierName): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function getTierFeatures(tier: TierName): string[] {
  const features: Record<TierName, string[]> = {
    free: [
      '30 meal generations/month',
      'Fridge + Pantry scanning',
      'Basic meal suggestions',
      'Simple health scores',
    ],
    premium: [
      '150 meal generations/month',
      'AI-generated meal images',
      'Full macro nutrient breakdown',
      'Recipe links & instructions',
      'Meal scoring & comparisons',
      'Advanced AI personalization',
      'Priority support',
    ],
    pro: [
      '500 meal generations/month',
      'Unlimited AI features',
      'Custom meal plans',
      'Advanced analytics',
      'API access',
      'Dedicated support',
    ],
  };
  return features[tier];
}
