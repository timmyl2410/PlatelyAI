// ============================================================================
// CANONICAL INVENTORY DATA LAYER
// Firestore CRUD for user inventory using new schema:
// - inventories/{uid} = InventoryDoc (parent doc)
// - inventories/{uid}/items/{itemId} = InventoryItem (subcollection)
// ============================================================================

import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  getDocs,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import type { InventoryDoc, InventoryItem } from '@plately/shared';

// ============================================================================
// HELPER: Ensure inventory parent doc exists
// ============================================================================

export const ensureInventoryDocExists = async (uid: string): Promise<void> => {
  const inventoryRef = doc(db, 'inventories', uid);
  const inventorySnap = await getDoc(inventoryRef);
  
  if (!inventorySnap.exists()) {
    console.log('📦 Creating inventory parent doc for user:', uid);
    await setDoc(inventoryRef, {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      itemsCount: 0,
      source: 'manual',
    } as Partial<InventoryDoc>);
  }
};

// ============================================================================
// HELPER: Normalize ingredient name for duplicate detection
// ============================================================================

export const normalizeIngredientName = (name: string): string => {
  return name.trim().toLowerCase();
};

// ============================================================================
// HELPER: Convert to Title Case for display
// ============================================================================

export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ============================================================================
// GET INVENTORY DOC (parent document)
// ============================================================================

export const getInventoryDoc = async (uid: string): Promise<InventoryDoc | null> => {
  try {
    const inventoryRef = doc(db, 'inventories', uid);
    const inventorySnap = await getDoc(inventoryRef);
    
    if (inventorySnap.exists()) {
      const data = inventorySnap.data() as InventoryDoc;
      return {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        lastScannedAt: data.lastScannedAt instanceof Timestamp ? data.lastScannedAt.toDate() : data.lastScannedAt,
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching inventory doc:', error);
    throw error;
  }
};

// ============================================================================
// GET ALL INVENTORY ITEMS
// ============================================================================

export const getInventoryItems = async (uid: string): Promise<(InventoryItem & { id: string })[]> => {
  try {
    console.log('📦 Fetching inventory items for user:', uid);
    
    const itemsRef = collection(db, 'inventories', uid, 'items');
    const itemsSnap = await getDocs(query(itemsRef));
    
    const items: (InventoryItem & { id: string })[] = [];
    itemsSnap.forEach((doc) => {
      const data = doc.data() as InventoryItem;
      items.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : data.expiresAt,
      });
    });
    
    console.log(`✅ Found ${items.length} inventory items`);
    return items;
  } catch (error) {
    console.error('❌ Error fetching inventory items:', error);
    throw error;
  }
};

// ============================================================================
// ADD INVENTORY ITEM
// ============================================================================

export const addInventoryItem = async (
  uid: string,
  item: Omit<InventoryItem, 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    console.log('➕ Adding inventory item for user:', uid, item.name);
    
    // Ensure parent doc exists
    await ensureInventoryDocExists(uid);
    
    // Create item document with auto-generated ID
    const itemsRef = collection(db, 'inventories', uid, 'items');
    const newItemRef = doc(itemsRef);
    
    await setDoc(newItemRef, {
      ...item,
      name: toTitleCase(item.name),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update parent doc itemsCount
    const inventoryRef = doc(db, 'inventories', uid);
    const items = await getInventoryItems(uid);
    await updateDoc(inventoryRef, {
      itemsCount: items.length,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Inventory item added:', newItemRef.id);
    return newItemRef.id;
  } catch (error) {
    console.error('❌ Error adding inventory item:', error);
    throw error;
  }
};

// ============================================================================
// UPDATE INVENTORY ITEM
// ============================================================================

export const updateInventoryItem = async (
  uid: string,
  itemId: string,
  updates: Partial<Omit<InventoryItem, 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    console.log('📝 Updating inventory item:', uid, itemId);
    
    const itemRef = doc(db, 'inventories', uid, 'items', itemId);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    // Update parent doc timestamp
    const inventoryRef = doc(db, 'inventories', uid);
    await updateDoc(inventoryRef, {
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Inventory item updated');
  } catch (error) {
    console.error('❌ Error updating inventory item:', error);
    throw error;
  }
};

// ============================================================================
// DELETE INVENTORY ITEM
// ============================================================================

export const deleteInventoryItem = async (uid: string, itemId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting inventory item:', uid, itemId);
    
    const itemRef = doc(db, 'inventories', uid, 'items', itemId);
    await deleteDoc(itemRef);
    
    // Update parent doc itemsCount
    const inventoryRef = doc(db, 'inventories', uid);
    const items = await getInventoryItems(uid);
    await updateDoc(inventoryRef, {
      itemsCount: items.length,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Inventory item deleted');
  } catch (error) {
    console.error('❌ Error deleting inventory item:', error);
    throw error;
  }
};

// ============================================================================
// CANONICAL UPSERT FUNCTION - Web platform adapter
// Uses shared cross-platform logic from @plately/shared
// ============================================================================

import { upsertInventoryItems as sharedUpsert, type UpsertInventoryItemInput } from '@plately/shared';

export const upsertInventoryItems = async (
  uid: string,
  items: UpsertInventoryItemInput[]
): Promise<void> => {
  await ensureInventoryDocExists(uid);
  
  const adapter = {
    getExistingItems: async (userId: string) => {
      return await getInventoryItems(userId);
    },
    updateItem: async (userId: string, itemId: string, data: any) => {
      const itemRef = doc(db, 'inventories', userId, 'items', itemId);
      await updateDoc(itemRef, data);
    },
    createItem: async (userId: string, data: any) => {
      const itemsRef = collection(db, 'inventories', userId, 'items');
      const newItemRef = doc(itemsRef);
      await setDoc(newItemRef, data);
    },
    updateParentDoc: async (userId: string, data: any) => {
      const inventoryRef = doc(db, 'inventories', userId);
      await updateDoc(inventoryRef, data);
    },
    serverTimestamp: () => serverTimestamp(),
  };
  
  await sharedUpsert(adapter, uid, items, 'scan');
};

// ============================================================================
// BATCH ADD ITEMS FROM SCAN (DEPRECATED - use upsertInventoryItems instead)
// ============================================================================

export const addItemsFromScan = async (
  uid: string,
  items: Array<{ name: string; category?: string; confidence?: number }>
): Promise<void> => {
  console.warn('⚠️ addItemsFromScan is deprecated. Use upsertInventoryItems() instead.');
  
  // Convert to new format and call upsert
  const upsertItems: UpsertInventoryItemInput[] = items.map(item => ({
    name: item.name,
    category: item.category,
    confidence: item.confidence,
    source: 'ai' as const,
  }));
  
  await upsertInventoryItems(uid, upsertItems);
};

// ============================================================================
// CLEAR ALL INVENTORY ITEMS
// ============================================================================

export const clearInventory = async (uid: string): Promise<void> => {
  try {
    console.log('🗑️ Clearing all inventory items for user:', uid);
    
    const itemsRef = collection(db, 'inventories', uid, 'items');
    const itemsSnap = await getDocs(query(itemsRef));
    
    const batch = writeBatch(db);
    itemsSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Update parent doc
    const inventoryRef = doc(db, 'inventories', uid);
    batch.update(inventoryRef, {
      itemsCount: 0,
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    console.log('✅ Inventory cleared');
  } catch (error) {
    console.error('❌ Error clearing inventory:', error);
    throw error;
  }
};

// ============================================================================
// MIGRATION HELPERS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Legacy function for old schema
 * Use getInventoryItems() instead
 */
export const getCurrentInventory = async (uid: string): Promise<any> => {
  console.warn('⚠️ getCurrentInventory is deprecated. Use getInventoryItems() instead.');
  const items = await getInventoryItems(uid);
  const inventoryDoc = await getInventoryDoc(uid);
  
  return {
    items: items.map(item => ({
      id: crypto.randomUUID(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      addedBy: item.source,
      updatedAt: item.updatedAt,
    })),
    updatedAt: inventoryDoc?.updatedAt || new Date(),
    lastScan: inventoryDoc?.lastScannedAt ? {
      scannedAt: inventoryDoc.lastScannedAt,
      photoUrl: '',
    } : undefined,
  };
};

/**
 * @deprecated Legacy function for old schema
 */
export const saveCurrentInventory = async (uid: string, inventory: any): Promise<void> => {
  console.warn('⚠️ saveCurrentInventory is deprecated. Use addInventoryItem() instead.');
  await ensureInventoryDocExists(uid);
  
  if (inventory.items && Array.isArray(inventory.items)) {
    for (const item of inventory.items) {
      await addInventoryItem(uid, {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        source: item.addedBy || 'user',
      });
    }
  }
};

/**
 * @deprecated Legacy function for old schema
 */
export const updateInventoryItems = async (uid: string, items: any[]): Promise<void> => {
  console.warn('⚠️ updateInventoryItems is deprecated. Use addInventoryItem() instead.');
  await ensureInventoryDocExists(uid);
  
  for (const item of items) {
    await addInventoryItem(uid, {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      source: item.addedBy || 'user',
    });
  }
};

/**
 * @deprecated Legacy function for old schema
 */
export const setLastScan = async (uid: string, _lastScan: any): Promise<void> => {
  console.warn('⚠️ setLastScan is deprecated. lastScannedAt is now updated automatically.');
  await ensureInventoryDocExists(uid);
  
  const inventoryRef = doc(db, 'inventories', uid);
  await updateDoc(inventoryRef, {
    lastScannedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * @deprecated Legacy function for old schema
 */
export const createInventoryFromScan = (
  foods: Array<{ id: string; name: string; category?: string }>,
  _photoUrl?: string
): any => {
  console.warn('⚠️ createInventoryFromScan is deprecated. Use addItemsFromScan() instead.');
  return {
    items: foods.map(food => ({
      id: food.id,
      name: food.name,
      category: food.category,
      addedBy: 'ai' as const,
      updatedAt: new Date(),
    })),
  };
};
