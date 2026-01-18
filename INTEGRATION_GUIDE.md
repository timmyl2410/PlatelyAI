# 🎯 Phase 3: Optional Integration Guide

**DO NOT DO THIS YET** unless you're ready to test thoroughly.

This guide shows how to safely integrate `@plately/shared` into your web app.

---

## Prerequisites

✅ Monorepo structure created (Phase 0-2 complete)  
✅ Shared package built: `cd packages/shared && pnpm build`  
✅ Web app currently working 100%  

---

## Step 1: Add Shared Package to Web App

```bash
# From workspace root
pnpm add @plately/shared@workspace:*
```

This adds to your web app's `package.json`:
```json
{
  "dependencies": {
    "@plately/shared": "workspace:*"
  }
}
```

---

## Step 2: Test Import (Non-Breaking)

Create a new test file to verify imports work:

```typescript
// src/test-shared.ts (NEW FILE - safe to create)
import { getPaths, paths, TIER_LIMITS } from '@plately/shared';

console.log('✅ Shared package imports work!');
console.log('Paths for user123:', getPaths('user123'));
console.log('Tier limits:', TIER_LIMITS);
```

Run this test:
```bash
pnpm dev
# Open browser console - you should see the logs
```

If imports work, proceed. If not, troubleshoot before continuing.

---

## Step 3: Safe Integration Points

### 3A: Replace Firestore Paths in Helper Files

**Start with low-risk files like utility helpers:**

#### Example: inventory.ts

```typescript
// src/lib/inventory.ts
import { paths } from '@plately/shared';

// BEFORE:
const docRef = doc(db, 'inventories', uid, 'current', 'data');

// AFTER:
const docRef = doc(db, paths.inventory.current(uid));
```

**Files to update (in order of safety):**
1. ✅ `src/lib/inventory.ts` - Helper functions only
2. ✅ `src/utils/foodCategorization.ts` - Utilities
3. ⚠️ `src/lib/firestoreUsers.ts` - User entitlements (be careful)
4. ⚠️ `netlify/functions/*` - Backend (test locally first!)
5. ❌ Auth-related code - Skip for now
6. ❌ Payment/Stripe code - Skip for now

### 3B: Use Shared Types

Replace local type definitions with shared ones:

```typescript
// src/lib/inventory.ts
import { type Inventory, type InventoryItem } from '@plately/shared';

// Remove local definitions:
// export type InventoryItem = { ... }
// export type Inventory = { ... }
```

---

## Step 4: Testing Checklist

After each change, test:

- [ ] Web app starts: `pnpm dev`
- [ ] No TypeScript errors
- [ ] Login works
- [ ] Inventory loads
- [ ] Scan works
- [ ] Meal generation works
- [ ] No console errors

**If anything breaks:** Revert the change immediately.

---

## Step 5: Backend Integration (High Risk)

⚠️ **DO NOT DO THIS** unless you're very confident.

The backend uses CommonJS (`require`), but shared package uses ES modules. This requires:

1. Convert backend to ES modules (change `require` to `import`)
2. OR: Build a CommonJS version of shared package
3. OR: Use dynamic imports in backend

**Recommendation:** Skip backend integration for now. Use shared types only in TypeScript (web/mobile).

---

## Rollback Strategy

If anything breaks:

### Quick Rollback (Remove Dependency)
```bash
# Remove from package.json dependencies
pnpm remove @plately/shared

# Reinstall to clean up
pnpm install
```

### Full Rollback (Remove Monorepo)
See [MONOREPO_SETUP.md](./MONOREPO_SETUP.md#-rollback-plan)

---

## Example: Safe Inventory.ts Update

Here's a complete example of safely updating `inventory.ts`:

```typescript
// src/lib/inventory.ts
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { paths, type Inventory, type InventoryItem } from '@plately/shared';

// Helper functions stay the same
export const normalizeIngredientName = (name: string): string => {
  return name.trim().toLowerCase();
};

export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Use shared paths (ONLY CHANGE)
export const getCurrentInventory = async (uid: string): Promise<Inventory | null> => {
  try {
    console.log('📦 Fetching inventory for user:', uid);
    const docRef = doc(db, paths.inventory.current(uid)); // <-- CHANGED
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Inventory found:', data);
      
      // Rest stays exactly the same
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

// Continue with rest of file...
```

**Key points:**
- Only the Firestore path changed
- All logic stays the same
- Types are now imported (optional - can keep local types)
- Test thoroughly after this change

---

## TODO Comments in Code

If you find risky integration points, add TODO comments:

```typescript
// TODO: [MONOREPO] Replace with paths.inventory.current(uid) from @plately/shared
// Risk: High - used in critical auth flow
// Status: Deferred until full testing
const docRef = doc(db, 'inventories', uid, 'current', 'data');
```

---

## Summary

✅ **Do now:** Add shared package, test imports  
⚠️ **Do carefully:** Replace paths in helper files  
❌ **Don't do yet:** Touch auth, payments, or backend  

The shared package is **optional**. If integration seems risky, skip it. The monorepo structure alone gives you co-location benefits.
