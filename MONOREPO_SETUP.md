# 🏗️ PlatelyAI Monorepo Setup

**Status**: ✅ Non-destructive monorepo structure created  
**Web App**: ✅ 100% working (no changes to runtime behavior)  
**Backend**: ✅ 100% working (no changes)  
**Netlify Deploy**: ✅ Still works exactly as before

---

## 📁 New Structure

```
PlatelyAIFolder/                    ← Your web app root (UNCHANGED)
├── package.json                    ← Updated with workspace scripts
├── pnpm-workspace.yaml             ← NEW: Enables monorepo
├── netlify.toml                    ← UNCHANGED
├── vite.config.ts                  ← UNCHANGED
├── src/                            ← UNCHANGED (all web code intact)
├── backend/                        ← UNCHANGED (backend still works)
├── netlify/functions/              ← UNCHANGED (serverless functions intact)
│
├── packages/                       ← NEW: Shared code
│   └── shared/                     ← NEW: @plately/shared package
│       ├── src/
│       │   ├── firestore/paths.ts  ← Canonical Firestore paths
│       │   ├── models/             ← Shared types
│       │   └── index.ts
│       └── package.json
│
└── apps/                           ← NEW: Apps folder
    └── mobile/                     ← NEW: Placeholder for mobile app
        └── README.md               ← Instructions to add your mobile repo
```

---

## 🚀 Running Locally

### Web App (Frontend)

```bash
# From workspace root
pnpm dev

# Or use the alias
pnpm dev:web
```

The web app runs **exactly as before** at http://localhost:5173

### Backend (Express Server)

```bash
# From workspace root
pnpm dev:backend

# Or navigate to backend folder
cd backend
pnpm dev
```

Backend runs on the port configured in `backend/server.js`

### Mobile App

**First time**: Follow instructions in `apps/mobile/README.md` to add your mobile app

**After setup**:
```bash
# From workspace root
cd apps/mobile
expo start

# Or if using React Native CLI
npx react-native start
```

---

## 🛠️ Building the Shared Package

The shared package needs to be built before other packages can use it:

```bash
# One-time build
cd packages/shared
pnpm build

# Watch mode (auto-rebuild on changes)
cd packages/shared
pnpm dev
```

---

## 📦 Using the Shared Package

### In Web App (Future - Optional)

Add to your web app's `package.json` dependencies:
```json
{
  "dependencies": {
    "@plately/shared": "workspace:*"
  }
}
```

Then import:
```typescript
import { getPaths, type Inventory } from '@plately/shared';

const paths = getPaths(uid);
const inventoryRef = doc(db, paths.inventory.current);
```

### In Mobile App

Same process - add dependency and import. See `apps/mobile/README.md` for details.

---

## 🔄 Rollback Plan

**If anything breaks**, simply delete the new folders:

```bash
# Delete new monorepo structure
rm -rf packages/
rm -rf apps/
rm pnpm-workspace.yaml

# Restore original package.json name if needed
# (Optional - the name change doesn't affect functionality)
```

**That's it!** Your web app and backend are completely unchanged and will work exactly as before.

---

## ⚠️ What Did NOT Change

✅ **Web app source code** - Zero changes to `src/`  
✅ **Backend code** - Zero changes to `backend/`  
✅ **Netlify functions** - Zero changes to `netlify/functions/`  
✅ **Build configuration** - `vite.config.ts` unchanged  
✅ **Deploy configuration** - `netlify.toml` unchanged  
✅ **Runtime behavior** - Nothing should behave differently  

---

## 🔮 Next Steps (Optional - Do Later)

### Phase 3A: Integrate Shared Package in Web App

⚠️ **Not done yet** - requires careful testing

1. Build the shared package: `cd packages/shared && pnpm build`
2. Add to web dependencies: `pnpm add @plately/shared@workspace:*`
3. Gradually replace hard-coded paths in **non-critical files first**:
   ```typescript
   // Before
   const docRef = doc(db, 'inventories', uid, 'current', 'data');
   
   // After
   import { paths } from '@plately/shared';
   const docRef = doc(db, paths.inventory.current(uid));
   ```
4. **Test thoroughly** before touching auth/payment code

### Phase 3B: Add Mobile App

Follow instructions in `apps/mobile/README.md`

---

## 🆘 Troubleshooting

### "Package not found: @plately/shared"

Run `pnpm install` from workspace root to link workspace packages.

### "Cannot find module '@plately/shared'"

Build the shared package first:
```bash
cd packages/shared
pnpm build
```

### Web app won't start

The monorepo setup shouldn't affect the web app. If it won't start:
1. Check if `pnpm dev` works (it should)
2. If not, run the rollback plan above
3. Report the issue - something unexpected happened

### Netlify deploy fails

The monorepo setup should NOT affect Netlify deploys. Check:
1. `netlify.toml` is unchanged (it should be)
2. Build command is still `npm run build` (it should be)
3. Publish directory is still `dist` (it should be)

If deploy fails, the monorepo structure is not the cause. Check environment variables.

---

## 📝 Notes

- **pnpm is recommended** but not required. npm and yarn should work too.
- The workspace root is your existing web app folder - nothing moved
- The shared package is **optional** - you can ignore it and the web app still works
- The mobile placeholder is just a folder - doesn't affect anything until you add code
- All changes are **additive** - we only added files, didn't modify existing ones (except package.json name/scripts)
