/**
 * @plately/shared
 * 
 * Shared types and constants for PlatelyAI web and mobile apps.
 * 
 * This package provides:
 * - Firestore path constants (no more hard-coded strings!)
 * - Type definitions for inventory, scans, meals, and users
 * - Zero runtime logic (types and constants only)
 */

// Firestore paths
export { getPaths, paths, type FirestorePaths } from './firestore/paths.js';

// Models
export type {
  InventoryDoc,
  InventoryItem,
  Inventory,
  LastScan,
  FoodCategory,
  FirestoreTimestamp,
} from './models/inventory.js';

export { FOOD_CATEGORIES } from './models/inventory.js';

export type {
  ScanRun,
  ScanResult,
} from './models/scans.js';

export type {
  MealDoc,
  Meal,
  MealGenerationRequest,
  MealGenerationResult,
} from './models/meals.js';

export type {
  UserDoc,
  UserEntitlements,
  TierName,
  TierStatus,
} from './models/user.js';

export { TIER_LIMITS } from './models/user.js';

// Inventory sync functions (shared cross-platform logic)
export { 
  upsertInventoryItems, 
  normalizeItemName, 
  toTitleCase,
  type UpsertInventoryItemInput,
  type InventoryUpsertResult 
} from './lib/inventorySync.js';
