/**
 * CANONICAL CROSS-PLATFORM INVENTORY SYNC
 * 
 * This is the SINGLE SOURCE OF TRUTH for inventory updates.
 * Both web and mobile MUST use these functions.
 * 
 * Rules enforced:
 * - Automatic deduplication by normalized name
 * - lastSeen timestamp updates for existing items
 * - No user confirmation required
 * - Idempotent operations
 */

export interface UpsertInventoryItemInput {
  name: string;
  category?: string;
  confidence?: number;
  source: 'ai' | 'manual';
}

export interface InventoryUpsertResult {
  added: number;
  updated: number;
  skipped: number;
}

/**
 * Normalize item name for canonical key generation
 * Simple: trim + lowercase
 */
export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Convert to Title Case for display
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * SHARED UPSERT LOGIC (platform-agnostic)
 * 
 * This function encapsulates ALL inventory update rules.
 * Call this from both web ReviewFoodsPage and mobile review-foods.
 * 
 * @param firestoreAdapter - Platform-specific Firestore operations
 * @param userId - Current user ID
 * @param items - Items to upsert
 * @param source - 'scan' or 'manual'
 * @returns Statistics about the operation
 */
export async function upsertInventoryItems(
  firestoreAdapter: {
    getExistingItems: (userId: string) => Promise<Array<{ id: string; name: string }>>;
    updateItem: (userId: string, itemId: string, data: { updatedAt: any }) => Promise<void>;
    createItem: (userId: string, data: {
      name: string;
      category?: string;
      confidence?: number;
      source: string;
      createdAt: any;
      updatedAt: any;
    }) => Promise<void>;
    updateParentDoc: (userId: string, data: { 
      itemsCount: number; 
      lastScannedAt?: any; 
      updatedAt: any;
      source?: string;
    }) => Promise<void>;
    serverTimestamp: () => any;
  },
  userId: string,
  items: UpsertInventoryItemInput[],
  scanSource: 'scan' | 'manual' = 'scan'
): Promise<InventoryUpsertResult> {
  console.log(`🔄 [InventorySync] Upserting ${items.length} items for user ${userId}`);
  
  // Get existing items
  const existingItems = await firestoreAdapter.getExistingItems(userId);
  
  // Build lookup map by normalized name
  const existingMap = new Map<string, string>(); // normalized name -> item ID
  existingItems.forEach(item => {
    const key = normalizeItemName(item.name);
    existingMap.set(key, item.id);
  });
  
  let added = 0;
  let updated = 0;
  let skipped = 0;
  
  // Process each item
  for (const item of items) {
    const normalizedKey = normalizeItemName(item.name);
    
    if (!normalizedKey) {
      skipped++;
      continue;
    }
    
    const existingId = existingMap.get(normalizedKey);
    
    if (existingId) {
      // Item exists: update lastSeen timestamp
      await firestoreAdapter.updateItem(userId, existingId, {
        updatedAt: firestoreAdapter.serverTimestamp(),
      });
      updated++;
      console.log(`✓ Updated lastSeen: ${item.name}`);
    } else {
      // New item: create it
      await firestoreAdapter.createItem(userId, {
        name: toTitleCase(item.name),
        category: item.category,
        confidence: item.confidence,
        source: item.source,
        createdAt: firestoreAdapter.serverTimestamp(),
        updatedAt: firestoreAdapter.serverTimestamp(),
      });
      existingMap.set(normalizedKey, 'new'); // Prevent duplicates in same batch
      added++;
      console.log(`✓ Added new: ${item.name}`);
    }
  }
  
  // Update parent doc
  await firestoreAdapter.updateParentDoc(userId, {
    itemsCount: existingItems.length + added,
    lastScannedAt: scanSource === 'scan' ? firestoreAdapter.serverTimestamp() : undefined,
    updatedAt: firestoreAdapter.serverTimestamp(),
    source: scanSource,
  });
  
  console.log(`✅ [InventorySync] Complete: +${added} ~${updated} =${skipped}`);
  
  return { added, updated, skipped };
}
