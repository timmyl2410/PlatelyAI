/**
 * CANONICAL FIRESTORE PATHS
 * 
 * Central source of truth for all Firestore collection paths.
 * Use these paths in web, mobile, and backend to avoid typos and ensure consistency.
 * 
 * SCHEMA:
 * - users/{uid} = UserDoc
 * - inventories/{uid} = InventoryDoc (parent doc MUST exist)
 * - inventories/{uid}/items/{itemId} = InventoryItem
 * - scans/{uid}/runs/{scanId} = ScanRun
 * - meals/{uid}/generated/{mealId} = MealDoc
 * - userEntitlements/{uid} = UserEntitlements (admin-only writes)
 * 
 * Usage:
 *   const paths = getPaths(uid);
 *   const inventoryRef = doc(db, ...paths.inventory.root.split('/'));
 *   const itemRef = doc(db, ...paths.inventory.item(itemId).split('/'));
 */

export interface FirestorePaths {
  // User profile document
  user: string;
  
  // User entitlements (subscription, tier, usage limits)
  userEntitlements: string;
  
  // Inventory paths
  inventory: {
    root: string;           // inventories/{uid}
    items: string;          // inventories/{uid}/items
    item: (itemId: string) => string;  // inventories/{uid}/items/{itemId}
  };
  
  // Scan paths
  scans: {
    root: string;           // scans/{uid}
    runs: string;           // scans/{uid}/runs
    run: (scanId: string) => string;  // scans/{uid}/runs/{scanId}
  };
  
  // Meal generation paths
  meals: {
    root: string;           // meals/{uid}
    generated: string;      // meals/{uid}/generated
    meal: (mealId: string) => string;  // meals/{uid}/generated/{mealId}
  };
}

/**
 * Get all Firestore paths for a specific user
 * @param uid - Firebase Auth user ID
 * @returns Object with all Firestore paths for this user
 */
export function getPaths(uid: string): FirestorePaths {
  return {
    user: `users/${uid}`,
    userEntitlements: `userEntitlements/${uid}`,
    
    inventory: {
      root: `inventories/${uid}`,
      items: `inventories/${uid}/items`,
      item: (itemId: string) => `inventories/${uid}/items/${itemId}`,
    },
    
    scans: {
      root: `scans/${uid}`,
      runs: `scans/${uid}/runs`,
      run: (scanId: string) => `scans/${uid}/runs/${scanId}`,
    },
    
    meals: {
      root: `meals/${uid}`,
      generated: `meals/${uid}/generated`,
      meal: (mealId: string) => `meals/${uid}/generated/${mealId}`,
    },
  };
}

/**
 * Individual path builders (for convenience when you only need one path)
 */
export const paths = {
  user: (uid: string) => `users/${uid}`,
  userEntitlements: (uid: string) => `userEntitlements/${uid}`,
  
  inventory: {
    root: (uid: string) => `inventories/${uid}`,
    items: (uid: string) => `inventories/${uid}/items`,
    item: (uid: string, itemId: string) => `inventories/${uid}/items/${itemId}`,
  },
  
  scans: {
    root: (uid: string) => `scans/${uid}`,
    runs: (uid: string) => `scans/${uid}/runs`,
    run: (uid: string, scanId: string) => `scans/${uid}/runs/${scanId}`,
  },
  
  meals: {
    root: (uid: string) => `meals/${uid}`,
    generated: (uid: string) => `meals/${uid}/generated`,
    meal: (uid: string, mealId: string) => `meals/${uid}/generated/${mealId}`,
  },
};
