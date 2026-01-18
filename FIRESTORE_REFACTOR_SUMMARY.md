# FIRESTORE SCHEMA REFACTOR SUMMARY

## ✅ COMPLETED WORK

### 1. Migration Script
**Location:** `scripts/migrateFirestoreSchema.ts`

Created idempotent migration script with:
- Dry-run mode for safe preview
- Converts old `inventories/{uid}/current/data` → new `inventories/{uid}` + `items/{itemId}` subcollection
- Creates missing `users/{uid}` documents
- Adds migration markers to prevent re-migration
- Full documentation in `scripts/README.md`

**Usage:**
```bash
cd scripts
npm install

# Preview changes (recommended first!)
npm run migrate:dry-run

# Run actual migration
npm run migrate
```

### 2. Shared Package Types
**Location:** `packages/shared/src/models/*.ts`

Updated canonical Firestore schema types:
- `InventoryDoc` - Parent document at `inventories/{uid}`
- `InventoryItem` - Subcollection items at `inventories/{uid}/items/{itemId}`
- `ScanRun` - Scan status tracking at `scans/{uid}/runs/{scanId}`
- `MealDoc` - Generated meals at `meals/{uid}/generated/{mealId}`
- `UserDoc` - User profiles at `users/{uid}`
- `UserEntitlements` - Subscriptions at `userEntitlements/{uid}`

### 3. Web App Refactor
**Status:** ✅ COMPLETE - Build passing, all components updated

#### src/lib/inventory.ts
Completely refactored with new functions:
- `ensureInventoryDocExists()` - Guarantees parent doc before subcollection writes
- `getInventoryDoc()` - Fetch parent document
- `getInventoryItems()` - Fetch all items from subcollection
- `addInventoryItem()` - Add single item
- `updateInventoryItem()` - Update single item
- `deleteInventoryItem()` - Delete single item
- `addItemsFromScan()` - Batch add items from scan with atomic operations
- `clearInventory()` - Delete all items

**Deprecated (with migration warnings):**
- `getCurrentInventory()` - Use `getInventoryItems()` + `getInventoryDoc()`
- `saveCurrentInventory()` - Use `addItemsFromScan()` or individual item operations
- `createInventoryFromScan()` - Use `addItemsFromScan()`
- `updateInventoryItems()` - Use `updateInventoryItem()` for each item

#### Updated Components
1. **UploadPage.tsx**
   - Changed: `getCurrentInventory()` → `getInventoryItems()`
   - Now fetches items as array instead of nested structure

2. **ReviewFoodsPage.tsx**
   - Changed: `saveCurrentInventory()` / `createInventoryFromScan()` → `addItemsFromScan()`
   - Converts FoodItems to InventoryItems with proper types

3. **InventoryPage.tsx**
   - Complete refactor to use:
     - `getInventoryItems()` - Load items
     - `addInventoryItem()` - Add new item
     - `updateInventoryItem()` - Edit item name/category
     - `deleteInventoryItem()` - Remove item
   - Removed auto-save timer (now immediate saves)
   - Items stored with document IDs for direct updates

#### src/lib/firestoreUser.ts (NEW)
Created user profile operations:
- `ensureUserDocExists()` - Create user doc if missing
- `getUserDoc()` - Fetch user profile
- `updateUserDoc()` - Update user fields

### 4. Firestore Security Rules
**Location:** `firestore.rules`

Created comprehensive UID-based security:
```javascript
// Helper function
function isOwner(uid) {
  return request.auth != null && request.auth.uid == uid;
}

// Rules
- users/{uid} - read/write only by owner
- inventories/{uid} - read/write only by owner
- inventories/{uid}/items/{itemId} - read/write only by owner
- scans/{uid}/runs/{scanId} - read/write only by owner
- meals/{uid}/generated/{mealId} - read/write only by owner
- userEntitlements/{uid} - read by owner, write by admin only
```

**Deploy:**
```bash
firebase deploy --only firestore:rules
```

---

## 🚧 REMAINING WORK

### Backend Server (backend/server.js)
**Status:** NOT STARTED

Current issues:
- Uses `db.collection('userEntitlements')` ✅ (correct - admin-only)
- **Missing:** Scan run logging at `scans/{uid}/runs/{scanId}`

**Required changes:**
1. Add scan run status tracking in POST `/api/scan`:
   ```javascript
   // Create scan run doc
   const scanRunRef = db.doc(`scans/${userId}/runs/${scanId}`);
   await scanRunRef.set({
     status: 'processing',
     startedAt: admin.firestore.FieldValue.serverTimestamp(),
     imageCount: imageUrls.length,
   });

   try {
     // ... existing scan logic ...
     
     // Update on success
     await scanRunRef.update({
       status: 'done',
       completedAt: admin.firestore.FieldValue.serverTimestamp(),
       extractedCount: foods.length,
     });
   } catch (error) {
     // Update on failure
     await scanRunRef.update({
       status: 'failed',
       completedAt: admin.firestore.FieldValue.serverTimestamp(),
       error: error.message,
     });
   }
   ```

### Netlify Functions (netlify/functions/*.js)
**Status:** NOT STARTED

Files to check:
- `meals.js` - May use old `users/{uid}` instead of `meals/{uid}/generated/{mealId}`
- `scan.js` - Add scan run logging
- Other files use correct paths (sessions, userEntitlements, recipeImages)

### Mobile App (apps/mobile/PlatelyAIMobile)
**Status:** NOT STARTED

Required changes:
1. Update Firestore operations to use new schema paths
2. Import types from `@plately/shared` package
3. Implement inventory CRUD with subcollections
4. Add scan run status tracking

---

## 📋 DEPLOYMENT CHECKLIST

### Before Migration
- [ ] **Backup Firestore data** (Firebase Console → Firestore → Export)
- [ ] Set up service account credentials:
  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
  ```
- [ ] Test migration script in dry-run mode:
  ```bash
  cd scripts && npm run migrate:dry-run
  ```
- [ ] Review dry-run output for accuracy

### During Migration
- [ ] Run migration script:
  ```bash
  cd scripts && npm run migrate
  ```
- [ ] Verify migration completed successfully (check console output)
- [ ] Spot-check migrated data in Firebase Console

### After Migration
- [ ] Deploy new Firestore security rules:
  ```bash
  firebase deploy --only firestore:rules
  ```
- [ ] Deploy web app with updated code:
  ```bash
  npm run build
  # Deploy to Netlify (automatic via Git push)
  ```
- [ ] Test critical user flows:
  - [ ] Sign in
  - [ ] Upload/scan images
  - [ ] View inventory
  - [ ] Add/edit/delete inventory items
  - [ ] Generate meals

### Monitoring
- [ ] Watch Firebase Console for errors
- [ ] Check Netlify logs for function errors
- [ ] Monitor user reports for issues
- [ ] Verify deprecated function warnings appear in console (helps catch missed migrations)

---

## 🔄 ROLLBACK PLAN

If migration fails or issues arise:

1. **Old data is preserved** - Migration doesn't delete `inventories/{uid}/current/data`
2. **Revert web app** - Deploy previous Git commit
3. **Revert security rules** - Restore old rules from Firebase Console
4. **Users can continue** - Old schema paths still exist

To fully rollback:
```bash
# Revert web app
git revert HEAD
git push

# Restore old security rules
firebase deploy --only firestore:rules
```

---

## 📝 SCHEMA REFERENCE

### OLD Schema
```
inventories/
  {uid}/
    current/
      data/
        items: [
          {
            id: string
            name: string
            category: string
            addedBy: 'ai' | 'user'
            updatedAt: Timestamp
          }
        ]
        lastScan: {
          photoUrl: string
          scannedAt: Timestamp
        }
        updatedAt: Timestamp
```

### NEW Schema (Canonical)
```
users/
  {uid}/
    email: string
    createdAt: Timestamp
    updatedAt: Timestamp
    plan: string

inventories/
  {uid}/                          <- Parent doc (MUST exist before adding items)
    createdAt: Timestamp
    updatedAt: Timestamp
    lastScannedAt: Timestamp
    itemsCount: number
    source: 'manual' | 'scan'
    
    items/                        <- Subcollection
      {itemId}/
        name: string
        category: string
        quantity: string?
        unit: string?
        expiresAt: Timestamp?
        confidence: number?
        source: 'ai' | 'user'
        createdAt: Timestamp
        updatedAt: Timestamp

scans/
  {uid}/
    runs/
      {scanId}/
        status: 'processing' | 'done' | 'failed'
        startedAt: Timestamp
        completedAt: Timestamp?
        imageCount: number
        extractedCount: number?
        error: string?

meals/
  {uid}/
    generated/
      {mealId}/
        title: string
        ingredients: string[]
        instructions: string[]
        prepTime: number
        cookTime: number
        servings: number
        imageUrl: string?
        createdAt: Timestamp

userEntitlements/
  {uid}/
    tier: 'free' | 'premium'
    subscriptionId: string?
    customerId: string?
    status: 'active' | 'canceled'
    updatedAt: Timestamp
```

---

## 🎯 KEY DIFFERENCES

### Before → After

1. **Inventory Storage**
   - Before: Array embedded in single doc
   - After: Subcollection with individual item docs
   - **Why:** Better scalability, atomic updates, no array size limits

2. **Parent Documents**
   - Before: No parent doc requirement
   - After: `inventories/{uid}` parent MUST exist before adding items
   - **Why:** Firestore requires parent docs for subcollections

3. **Item Updates**
   - Before: Fetch entire array → modify → save entire array
   - After: Update individual item documents
   - **Why:** More efficient, less data transfer, atomic operations

4. **Scan Tracking**
   - Before: No scan history
   - After: `scans/{uid}/runs/{scanId}` with status tracking
   - **Why:** Debug scan failures, track usage, improve UX

5. **Security**
   - Before: Collection-level rules (incomplete)
   - After: UID-based ownership at document level
   - **Why:** Prevent data leaks, enforce user boundaries

---

## 🐛 COMMON ISSUES & FIXES

### "Missing parent document" error
**Cause:** Trying to write to subcollection without parent doc  
**Fix:** All inventory operations now call `ensureInventoryDocExists()` first

### "Cannot find module '@plately/shared'"
**Cause:** Shared package not built  
**Fix:**
```bash
cd packages/shared
pnpm build
```

### "Permission denied" in Firestore
**Cause:** Security rules not deployed  
**Fix:**
```bash
firebase deploy --only firestore:rules
```

### Migration script hangs
**Cause:** Large dataset or network issues  
**Fix:** Run with smaller batches, check Firebase quotas

### Old data still showing
**Cause:** Web app using deprecated functions  
**Fix:** Check console for deprecation warnings, update code

---

## 📞 SUPPORT

If you encounter issues during migration:
1. Check Firebase Console for error logs
2. Review `scripts/README.md` for migration troubleshooting
3. Check web app console for deprecation warnings
4. Verify security rules deployed correctly

## 🎉 BENEFITS OF NEW SCHEMA

✅ **Scalability** - No array size limits, subcollections scale infinitely  
✅ **Performance** - Update single items without fetching/writing entire inventory  
✅ **Security** - Document-level ownership enforcement  
✅ **Debugging** - Scan run history helps troubleshoot failures  
✅ **Atomic Operations** - Firestore batches prevent partial updates  
✅ **Mobile Ready** - Shared types ensure consistency across platforms  
✅ **Future-Proof** - Extensible schema for new features (expiration dates, quantities, etc.)
