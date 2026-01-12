// Firestore User Entitlements Management

import { getFirestore, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { app } from './firebase';
import type { UserEntitlements, TierName } from './entitlements';
import { TIER_LIMITS, getNextResetDate } from './entitlements';

const db = getFirestore(app);

export async function getUserEntitlements(uid: string): Promise<UserEntitlements | null> {
  try {
    const userDoc = await getDoc(doc(db, 'userEntitlements', uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    
    // Helper to convert various date formats
    const toDate = (val: any): Date => {
      if (!val) return new Date();
      if (val.toDate) return val.toDate(); // Firestore Timestamp
      if (typeof val === 'string') return new Date(val); // ISO string
      if (val instanceof Date) return val;
      return new Date();
    };
    
    return {
      uid,
      tier: data.tier || 'free',
      tierStatus: data.tierStatus || 'active',
      mealGenerationsUsed: data.mealGenerationsUsed || 0,
      mealGenerationsLimit: data.mealGenerationsLimit || 25,
      billingPeriodStart: toDate(data.billingPeriodStart),
      nextResetAt: toDate(data.nextResetAt),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      currentPeriodEnd: data.currentPeriodEnd,
      subscriptionStatus: data.subscriptionStatus,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    };
  } catch (error) {
    console.error('Error fetching user entitlements:', error);
    return null;
  }
}

export async function createUserEntitlements(uid: string): Promise<UserEntitlements> {
  const now = new Date();
  const nextReset = getNextResetDate(now);
  
  const entitlements: UserEntitlements = {
    uid,
    tier: 'free',
    tierStatus: 'active',
    mealGenerationsUsed: 0,
    mealGenerationsLimit: TIER_LIMITS.free.mealGenerationsLimit,
    billingPeriodStart: now,
    nextResetAt: nextReset,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'userEntitlements', uid), {
      tier: entitlements.tier,
      tierStatus: entitlements.tierStatus,
      mealGenerationsUsed: entitlements.mealGenerationsUsed,
      mealGenerationsLimit: entitlements.mealGenerationsLimit,
      billingPeriodStart: Timestamp.fromDate(entitlements.billingPeriodStart),
      nextResetAt: Timestamp.fromDate(entitlements.nextResetAt),
      createdAt: Timestamp.fromDate(entitlements.createdAt),
      updatedAt: Timestamp.fromDate(entitlements.updatedAt),
    });

    return entitlements;
  } catch (error) {
    console.error('Error creating user entitlements:', error);
    throw error;
  }
}

export async function getOrCreateUserEntitlements(uid: string): Promise<UserEntitlements> {
  let entitlements = await getUserEntitlements(uid);
  
  if (!entitlements) {
    entitlements = await createUserEntitlements(uid);
  }

  return entitlements;
}

export async function updateUserTier(uid: string, tier: TierName): Promise<void> {
  try {
    await updateDoc(doc(db, 'userEntitlements', uid), {
      tier,
      mealGenerationsLimit: TIER_LIMITS[tier].mealGenerationsLimit,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error updating user tier:', error);
    throw error;
  }
}

export async function incrementMealGenerations(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'userEntitlements', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const currentUsed = userDoc.data().mealGenerationsUsed || 0;
    
    await updateDoc(userRef, {
      mealGenerationsUsed: currentUsed + 1,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error incrementing meal generations:', error);
    throw error;
  }
}

export async function resetMonthlyUsage(uid: string): Promise<void> {
  try {
    const now = new Date();
    const nextReset = getNextResetDate(now);

    await updateDoc(doc(db, 'userEntitlements', uid), {
      mealGenerationsUsed: 0,
      billingPeriodStart: Timestamp.fromDate(now),
      nextResetAt: Timestamp.fromDate(nextReset),
      updatedAt: Timestamp.fromDate(now),
    });
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    throw error;
  }
}

export async function addToProWaitlist(uid: string, email: string | null): Promise<void> {
  try {
    await setDoc(doc(db, 'pro_waitlist', uid), {
      uid,
      email,
      createdAt: Timestamp.fromDate(new Date()),
      appVersion: '1.0.0',
    });
  } catch (error) {
    console.error('Error adding to pro waitlist:', error);
    throw error;
  }
}
