// ============================================================================
// SAVED INVENTORY DATA LAYER
// Simple Firestore CRUD for user's saved fridge inventory
// ============================================================================

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type InventoryItem = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  addedBy: 'ai' | 'user';
  updatedAt: Date;
};

export type LastScan = {
  photoUrl: string;
  scannedAt: Date | { toDate: () => Date }; // Support both Date and Firestore Timestamp
};

export type Inventory = {
  items: InventoryItem[];
  lastScan?: LastScan;
  updatedAt: Date;
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
// GET CURRENT INVENTORY
// ============================================================================

export const getCurrentInventory = async (uid: string): Promise<Inventory | null> => {
  try {
    console.log('📦 Fetching inventory for user:', uid);
    const docRef = doc(db, 'inventories', uid, 'current', 'data');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Inventory found:', data);
      
      // Convert Firestore Timestamps to Dates
      let lastScan = data.lastScan;
      if (lastScan?.scannedAt) {
        lastScan = {
          ...lastScan,
          scannedAt: lastScan.scannedAt.toDate ? lastScan.scannedAt.toDate() : lastScan.scannedAt
        };
      }
      
      return {
        items: data.items || [],
        lastScan,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } else {
      console.log('ℹ️ No inventory found for user');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching inventory:', error);
    throw error;
  }
};

// ============================================================================
// SAVE/UPDATE CURRENT INVENTORY
// ============================================================================

export const saveCurrentInventory = async (
  uid: string,
  inventory: Omit<Inventory, 'updatedAt'>
): Promise<void> => {
  try {
    console.log('💾 Saving inventory for user:', uid);
    const docRef = doc(db, 'inventories', uid, 'current', 'data');

    // Remove duplicates based on normalized name
    const uniqueItems = inventory.items.reduce((acc, item) => {
      const normalized = normalizeIngredientName(item.name);
      const existing = acc.find(i => normalizeIngredientName(i.name) === normalized);
      
      if (!existing) {
        acc.push({
          ...item,
          name: toTitleCase(item.name), // Store in Title Case
        });
      }
      return acc;
    }, [] as InventoryItem[]);

    // Prepare lastScan with server timestamp if it's new
    const lastScanToSave = inventory.lastScan ? {
      photoUrl: inventory.lastScan.photoUrl,
      scannedAt: serverTimestamp(), // Always use server time for accuracy
    } : undefined;

    await setDoc(docRef, {
      items: uniqueItems,
      ...(lastScanToSave && { lastScan: lastScanToSave }),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Inventory saved successfully');
  } catch (error) {
    console.error('❌ Error saving inventory:', error);
    throw error;
  }
};

// ============================================================================
// UPDATE ONLY ITEMS (keep lastScan unchanged)
// ============================================================================

export const updateInventoryItems = async (uid: string, items: InventoryItem[]): Promise<void> => {
  try {
    console.log('📝 Updating inventory items for user:', uid);
    const docRef = doc(db, 'inventories', uid, 'current', 'data');

    // Remove duplicates
    const uniqueItems = items.reduce((acc, item) => {
      const normalized = normalizeIngredientName(item.name);
      const existing = acc.find(i => normalizeIngredientName(i.name) === normalized);
      
      if (!existing) {
        acc.push({
          ...item,
          name: toTitleCase(item.name),
        });
      }
      return acc;
    }, [] as InventoryItem[]);

    await updateDoc(docRef, {
      items: uniqueItems,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Inventory items updated');
  } catch (error) {
    console.error('❌ Error updating inventory items:', error);
    throw error;
  }
};

// ============================================================================
// SET LAST SCAN INFO (photo + timestamp)
// ============================================================================

export const setLastScan = async (uid: string, lastScan: LastScan): Promise<void> => {
  try {
    console.log('📸 Setting last scan info for user:', uid);
    const docRef = doc(db, 'inventories', uid, 'current', 'data');

    await updateDoc(docRef, {
      lastScan,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Last scan info updated');
  } catch (error) {
    console.error('❌ Error updating last scan:', error);
    throw error;
  }
};

// ============================================================================
// CREATE INVENTORY FROM SCAN RESULTS
// Helper to convert scanned food items to inventory items
// ============================================================================

export const createInventoryFromScan = (
  foods: Array<{ id: string; name: string; category?: string }>,
  photoUrl?: string
): Omit<Inventory, 'updatedAt'> => {
  const items: InventoryItem[] = foods.map(food => ({
    id: food.id,
    name: food.name,
    category: food.category,
    addedBy: 'ai' as const,
    updatedAt: new Date(),
  }));

  const inventory: Omit<Inventory, 'updatedAt'> = {
    items,
  };

  if (photoUrl) {
    inventory.lastScan = {
      photoUrl,
      scannedAt: new Date(),
    };
  }

  return inventory;
};
