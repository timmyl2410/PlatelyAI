// ============================================================================
// USER DOCUMENT OPERATIONS
// Manages users/{uid} documents (profile data)
// ============================================================================

import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from './firebase';
import type { UserDoc } from '@plately/shared';

const db = getFirestore(app);

/**
 * Ensure user document exists (create on first login/interaction)
 */
export async function ensureUserDocExists(
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    console.log('👤 Creating user document for:', email);
    await setDoc(userRef, {
      email,
      displayName: displayName || null,
      photoURL: photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      plan: 'free',
      settings: {
        notifications: true,
        theme: 'auto',
      },
    } as Partial<UserDoc>);
  }
}

/**
 * Get user document
 */
export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserDoc;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user document:', error);
    throw error;
  }
}

/**
 * Update user document
 */
export async function updateUserDoc(
  uid: string,
  updates: Partial<Omit<UserDoc, 'createdAt' | 'email'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
}
