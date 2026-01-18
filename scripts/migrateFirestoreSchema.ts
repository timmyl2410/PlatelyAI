#!/usr/bin/env node
/**
 * FIRESTORE SCHEMA MIGRATION SCRIPT
 * 
 * Migrates from old schema to canonical schema:
 * OLD: inventories/{uid}/current/data (single doc with items array)
 * NEW: inventories/{uid} (parent doc) + inventories/{uid}/items/{itemId} (subcollection)
 * 
 * USAGE:
 *   DRY RUN (preview changes):
 *     node scripts/migrateFirestoreSchema.ts --dry-run
 * 
 *   LIVE MIGRATION:
 *     node scripts/migrateFirestoreSchema.ts
 * 
 * PREREQUISITES:
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable:
 *      export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
 *   
 *   2. Or provide service account JSON directly:
 *      export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
 * 
 * FEATURES:
 *   - Idempotent (safe to re-run)
 *   - Dry-run mode to preview changes
 *   - Skips already migrated documents
 *   - Adds migration marker to prevent re-migration
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run');

console.log('🔧 Firestore Schema Migration');
console.log(`📋 Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
console.log('');

// ============================================================================
// INITIALIZE FIREBASE ADMIN
// ============================================================================

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('✅ Using service account from GOOGLE_APPLICATION_CREDENTIALS');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('✅ Using service account from FIREBASE_SERVICE_ACCOUNT');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Validate service account has required fields
    if (!serviceAccount.type || !serviceAccount.project_id || !serviceAccount.private_key) {
      throw new Error('Invalid service account JSON. Must include type, project_id, and private_key');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    throw new Error(
      'Missing Firebase credentials. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT'
    );
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error);
  console.error('');
  console.error('💡 Setup instructions:');
  console.error('   1. Download service account key from Firebase Console');
  console.error('   2. Set environment variable:');
  console.error('      export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"');
  console.error('   OR provide JSON directly:');
  console.error('      export FIREBASE_SERVICE_ACCOUNT=\'{"type":"service_account",...}\'');
  process.exit(1);
}

const db = admin.firestore();

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

interface OldInventoryItem {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  addedBy: 'ai' | 'user';
  updatedAt: Date | admin.firestore.Timestamp;
}

interface OldInventoryDoc {
  items: OldInventoryItem[];
  lastScan?: {
    photoUrl: string;
    scannedAt: Date | admin.firestore.Timestamp;
  };
  updatedAt: Date | admin.firestore.Timestamp;
}

async function migrateInventory(uid: string, oldData: OldInventoryDoc): Promise<void> {
  const inventoryRef = db.doc(`inventories/${uid}`);
  const inventorySnap = await inventoryRef.get();
  
  // Check if already migrated
  if (inventorySnap.exists && inventorySnap.data()?.migratedAt) {
    console.log(`  ⏭️  Already migrated, skipping`);
    return;
  }
  
  console.log(`  📦 Migrating ${oldData.items?.length || 0} items`);
  
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create inventories/${uid} with ${oldData.items?.length || 0} items`);
    return;
  }
  
  const batch = db.batch();
  
  // Create parent document
  batch.set(inventoryRef, {
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastScannedAt: oldData.lastScan?.scannedAt || null,
    itemsCount: oldData.items?.length || 0,
    source: oldData.lastScan ? 'scan' : 'manual',
    migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    migratedFrom: 'inventories/{uid}/current/data',
  });
  
  // Create items subcollection
  if (oldData.items && Array.isArray(oldData.items)) {
    for (const item of oldData.items) {
      const itemRef = db.collection(`inventories/${uid}/items`).doc();
      batch.set(itemRef, {
        name: item.name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        category: item.category || null,
        source: item.addedBy || 'user',
        confidence: null,
        expiresAt: null,
        createdAt: item.updatedAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  
  await batch.commit();
  console.log(`  ✅ Migrated ${oldData.items?.length || 0} items`);
}

async function findAndMigrateOldInventories(): Promise<void> {
  console.log('🔍 Searching for old inventory documents...');
  console.log('');
  
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  try {
    // Find all inventory documents in old location
    const inventoriesSnap = await db.collection('inventories').get();
    
    for (const inventoryDoc of inventoriesSnap.docs) {
      const uid = inventoryDoc.id;
      console.log(`👤 User: ${uid}`);
      
      try {
        // Check if old schema exists (inventories/{uid}/current/data)
        const oldDocRef = db.doc(`inventories/${uid}/current/data`);
        const oldDocSnap = await oldDocRef.get();
        
        if (oldDocSnap.exists) {
          const oldData = oldDocSnap.data() as OldInventoryDoc;
          await migrateInventory(uid, oldData);
          migratedCount++;
        } else {
          console.log(`  ℹ️  No old schema data found`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error migrating user ${uid}:`, error);
        errorCount++;
      }
      
      console.log('');
    }
    
    console.log('📊 MIGRATION SUMMARY');
    console.log(`  ✅ Migrated: ${migratedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    if (DRY_RUN) {
      console.log('');
      console.log('🔄 This was a DRY RUN. No changes were made.');
      console.log('💡 Run without --dry-run to perform actual migration.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function createUserDocuments(): Promise<void> {
  console.log('');
  console.log('👥 Ensuring user documents exist...');
  console.log('');
  
  try {
    const entitlementsSnap = await db.collection('userEntitlements').get();
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const entitlementDoc of entitlementsSnap.docs) {
      const uid = entitlementDoc.id;
      const userRef = db.doc(`users/${uid}`);
      const userSnap = await userRef.get();
      
      if (!userSnap.exists) {
        console.log(`  👤 Creating user doc for: ${uid}`);
        
        if (!DRY_RUN) {
          await userRef.set({
            email: 'unknown@example.com', // Placeholder, update manually if needed
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            plan: entitlementDoc.data().tier || 'free',
          });
        }
        createdCount++;
      } else {
        existingCount++;
      }
    }
    
    console.log('');
    console.log(`  ✅ Created: ${createdCount}`);
    console.log(`  ℹ️  Already exist: ${existingCount}`);
  } catch (error) {
    console.error('❌ Error creating user documents:', error);
    throw error;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    await findAndMigrateOldInventories();
    await createUserDocuments();
    
    console.log('');
    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
