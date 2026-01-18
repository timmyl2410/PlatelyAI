/**
 * INVENTORY MODEL
 * 
 * Shared types for user inventory management.
 * Used by web and mobile apps.
 * 
 * CANONICAL SCHEMA:
 * - inventories/{uid} = InventoryDoc (parent document)
 * - inventories/{uid}/items/{itemId} = InventoryItem (subcollection)
 */

// Use 'any' for Firestore Timestamp to avoid environment-specific imports
// Web uses firebase/firestore, mobile uses @react-native-firebase/firestore
export type FirestoreTimestamp = any;

/**
 * Parent document: inventories/{uid}
 * This doc MUST exist before adding items to subcollection
 */
export interface InventoryDoc {
  createdAt: Date | FirestoreTimestamp;
  updatedAt: Date | FirestoreTimestamp;
  lastScannedAt?: Date | FirestoreTimestamp;
  itemsCount: number;
  source?: 'manual' | 'scan' | 'import';
}

/**
 * Subcollection document: inventories/{uid}/items/{itemId}
 */
export interface InventoryItem {
  name: string;
  category?: string;
  quantity?: string;
  unit?: string;
  expiresAt?: Date | FirestoreTimestamp;
  confidence?: number; // AI detection confidence 0-1
  source: 'ai' | 'user';
  createdAt: Date | FirestoreTimestamp;
  updatedAt: Date | FirestoreTimestamp;
}

/**
 * @deprecated Legacy type for old schema migration
 */
export interface LastScan {
  photoUrl: string;
  scannedAt: Date | FirestoreTimestamp;
}

/**
 * @deprecated Legacy type for old schema migration
 */
export interface Inventory {
  items: InventoryItem[];
  lastScan?: LastScan;
  updatedAt: Date | FirestoreTimestamp;
}

/**
 * Food categories used for inventory organization
 */
export const FOOD_CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Meat',
  'Dairy',
  'Grains',
  'Condiments',
  'Beverages',
  'Snacks',
  'Other',
] as const;

export type FoodCategory = typeof FOOD_CATEGORIES[number];
