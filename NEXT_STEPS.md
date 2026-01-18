# NEXT STEPS - Complete Firestore Refactor

## 🎯 Immediate Action Items

### 1. Add Scan Run Logging (Backend)
**File:** `backend/server.js` line ~241 (POST `/api/scan`)

Add before OpenAI call:
```javascript
// At the start of the /api/scan handler
const scanId = uuidv4();
const db = getFirestore();

// Extract userId from auth token (add auth middleware if missing)
const authHeader = req.headers.authorization;
const token = authHeader?.split('Bearer ')[1];
const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
const userId = decodedToken.uid;

// Create scan run document
const scanRunRef = db.doc(`scans/${userId}/runs/${scanId}`);
await scanRunRef.set({
  status: 'processing',
  startedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
  imageCount: imageUrls.length,
  imageUrls: imageUrls,
});
```

Update success path:
```javascript
// After successful food detection
await scanRunRef.update({
  status: 'done',
  completedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
  extractedCount: foods.length,
});

return res.json({ foods, scanId }); // Add scanId to response
```

Update error path:
```javascript
// In catch block
await scanRunRef.update({
  status: 'failed',
  completedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
  error: error?.message || String(error),
});
```

### 2. Update Netlify Functions
Check these files for old Firestore paths:

**netlify/functions/meals.js:**
```javascript
// OLD (if present):
const userRef = db.collection('users').doc(userId);

// NEW:
const mealRef = db.doc(`meals/${userId}/generated/${mealId}`);
await mealRef.set({
  title: meal.title,
  ingredients: meal.ingredients,
  instructions: meal.instructions,
  prepTime: meal.prepTime,
  cookTime: meal.cookTime,
  servings: meal.servings,
  imageUrl: meal.imageUrl,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

**netlify/functions/scan.js** (if exists):
Add same scan run logging as backend/server.js above.

### 3. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Run Migration
```bash
cd scripts
npm install

# DRY RUN FIRST!
npm run migrate:dry-run

# Review output, then:
npm run migrate
```

### 5. Deploy Web App
```bash
# Build and test locally
npm run build
npm run preview

# Push to Git (auto-deploys via Netlify)
git add .
git commit -m "feat: migrate to canonical Firestore schema"
git push origin main
```

---

## 🧪 Testing Checklist

After deployment, test these flows:

### Critical Path
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Upload fridge photos
- [ ] Scan completes successfully
- [ ] Review detected foods
- [ ] Save to inventory
- [ ] View inventory page
- [ ] Add manual item
- [ ] Edit item name
- [ ] Delete item
- [ ] Generate meals from inventory
- [ ] View generated meals

### Edge Cases
- [ ] Scan with 0 foods detected
- [ ] Scan with network error
- [ ] Save to inventory without scan
- [ ] Generate meals with <3 items (should warn)
- [ ] Access inventory when not signed in (should redirect)

### Data Integrity
- [ ] Old inventory data migrated correctly
- [ ] No duplicate items after migration
- [ ] Item counts match between parent doc and subcollection
- [ ] Timestamps converted correctly (not showing "Invalid Date")

---

## 📊 Monitoring

Check these after deployment:

### Firebase Console
- Navigate to Firestore
- Spot-check migrated data:
  - `inventories/{uid}` has createdAt, updatedAt, itemsCount
  - `inventories/{uid}/items` has documents with proper IDs
  - `users/{uid}` exists for each user
- Watch for error logs in Functions tab

### Web App Console
Look for:
- ✅ No "deprecated function" warnings (if you see them, some component still using old API)
- ✅ No Firestore permission errors
- ✅ Inventory items loading correctly
- ❌ Check for any new errors

### Netlify Logs
- Open Netlify dashboard → Functions
- Check for any 500 errors
- Verify scan.js and meals.js executing successfully

---

## 🔧 Quick Fixes

### If users can't see their inventory
```javascript
// Check if parent doc exists
const inventoryRef = db.doc(`inventories/${uid}`);
const snap = await inventoryRef.get();
if (!snap.exists()) {
  // Parent doc missing - fix by calling ensureInventoryDocExists
  await ensureInventoryDocExists(uid);
}
```

### If migration failed mid-way
Safe to re-run - script is idempotent:
```bash
cd scripts
npm run migrate
```

### If security rules blocking writes
Verify rules deployed:
```bash
firebase firestore:rules:get
```

Should show UID-based ownership functions.

---

## 📝 Code Snippets for Reference

### Add Auth to Backend Routes
```javascript
// Add this middleware to backend/server.js
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Use in routes:
app.post('/api/scan', authenticateUser, async (req, res) => {
  const userId = req.user.uid; // Now available
  // ... rest of handler
});
```

### Query Inventory Items with Filter
```javascript
// Get items by category
import { collection, query, where, getDocs } from 'firebase/firestore';

const itemsRef = collection(db, 'inventories', uid, 'items');
const q = query(itemsRef, where('category', '==', 'Vegetables'));
const snapshot = await getDocs(q);

const vegetables = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Batch Delete All Items
```javascript
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
const itemsSnap = await getDocs(collection(db, 'inventories', uid, 'items'));
itemsSnap.forEach((doc) => batch.delete(doc.ref));
await batch.commit();
```

---

## 🚀 Future Enhancements (Post-Migration)

Once canonical schema is live, consider:

1. **Expiration Tracking**
   - Add `expiresAt` field usage in UI
   - Show "expiring soon" warnings
   - Filter expired items

2. **Quantity Management**
   - UI for editing quantity/unit
   - Track usage over time
   - Low stock alerts

3. **Scan History**
   - Show list of past scans (use `scans/{uid}/runs` collection)
   - Compare scans over time
   - Replay scan results

4. **Shared Inventories**
   - Add `inventories/{inventoryId}/members/{uid}` subcollection
   - Update security rules for multi-user access
   - Household/roommate sharing

5. **Export/Import**
   - Export inventory to CSV
   - Import from grocery apps
   - Sync with meal planning tools

---

## ❓ FAQ

**Q: Can I run the migration multiple times?**  
A: Yes, it's idempotent. Already-migrated docs are skipped.

**Q: Will users lose data during migration?**  
A: No, old data remains intact. Migration creates new documents.

**Q: How long does migration take?**  
A: ~1 second per user. 100 users ≈ 2 minutes.

**Q: Can I migrate only specific users?**  
A: Edit `scripts/migrateFirestoreSchema.ts` to add user ID filter.

**Q: What if I need to rollback?**  
A: Old data still exists. Revert code + security rules to go back.

**Q: Why do I see "deprecated function" warnings?**  
A: Some component still calling old API. Check component files listed in warning.

---

## 📞 Need Help?

Check:
1. [FIRESTORE_REFACTOR_SUMMARY.md](./FIRESTORE_REFACTOR_SUMMARY.md) - Complete overview
2. [scripts/README.md](./scripts/README.md) - Migration guide
3. Firebase Console → Firestore → Indexes/Rules
4. Browser console for specific errors

Common issues documented in FIRESTORE_REFACTOR_SUMMARY.md § Common Issues & Fixes.
