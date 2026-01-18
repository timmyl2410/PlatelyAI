/**
 * USER MODEL
 * 
 * Shared types for user profiles and entitlements.
 * Used by web and mobile apps.
 * 
 * CANONICAL SCHEMA:
 * - users/{uid} = UserDoc (profile data)
 * - userEntitlements/{uid} = UserEntitlements (subscription/usage, admin-only writes)
 */

import type { FirestoreTimestamp } from './inventory.js';

/**
 * Document: users/{uid}
 * Basic user profile information
 */
export interface UserDoc {
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date | FirestoreTimestamp;
  updatedAt: Date | FirestoreTimestamp;
  plan?: TierName;
  settings?: {
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
  };
}

export type TierName = 'free' | 'premium';
export type TierStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';

/**
 * Document: userEntitlements/{uid}
 * Subscription and usage tracking (backend/admin-only writes)
 */
export interface UserEntitlements {
  uid: string;
  tier: TierName;
  tierStatus: TierStatus;
  
  // Usage limits
  mealGenerationsUsed: number;
  mealGenerationsLimit: number;
  
  // Billing period
  billingPeriodStart: Date | FirestoreTimestamp;
  nextResetAt: Date | FirestoreTimestamp;
  
  // Stripe integration
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: Date | FirestoreTimestamp;
  
  // Timestamps
  createdAt: Date | FirestoreTimestamp;
  updatedAt: Date | FirestoreTimestamp;
}

/**
 * Tier limits configuration
 */
export const TIER_LIMITS = {
  free: {
    mealGenerations: 25,
  },
  premium: {
    mealGenerations: Infinity,
  },
} as const;
