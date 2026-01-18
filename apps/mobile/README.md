# PlatelyAI Mobile App

This folder is a placeholder for your Expo/React Native mobile app.

## Setup Instructions

### Step 1: Copy Your Mobile Repo Here

Copy or move your existing mobile app repository into this folder:

```bash
# Option A: Copy from another location
cp -r /path/to/your/mobile-repo/* ./apps/mobile/

# Option B: Clone if it's in a separate Git repo
cd apps/mobile
git clone <your-mobile-repo-url> .

# Option C: Move the folder
mv /path/to/your/mobile-repo/* ./apps/mobile/
```

### Step 2: Install Dependencies

```bash
cd apps/mobile
pnpm install
```

### Step 3: Add Shared Package

Add the shared package to your mobile app's `package.json`:

```bash
pnpm add @plately/shared@workspace:*
```

Or manually add to `package.json`:
```json
{
  "dependencies": {
    "@plately/shared": "workspace:*"
  }
}
```

### Step 4: Use Shared Types

In your mobile app code:

```typescript
import { getPaths, type Inventory, type Meal } from '@plately/shared';

// Use canonical Firestore paths
const paths = getPaths(userId);
const inventoryRef = doc(db, paths.inventory.current);

// Use shared types
const inventory: Inventory = {
  items: [],
  updatedAt: new Date()
};
```

## Running the Mobile App

After setup, run from the workspace root:

```bash
# From workspace root
pnpm dev:mobile

# Or navigate here and run directly
cd apps/mobile
expo start
# or
npx react-native start
```

## Expected Structure

After copying your mobile app, this folder should contain:

```
apps/mobile/
├── package.json          # Your mobile app package.json
├── app.json             # Expo config (if using Expo)
├── tsconfig.json        # TypeScript config
├── App.tsx or App.js    # Main app entry
├── src/                 # Your mobile app source code
│   ├── screens/
│   ├── components/
│   └── ...
└── ...
```

## Important Notes

- ⚠️ **Keep your existing mobile app structure** - don't refactor everything at once
- ⚠️ **The shared package is optional** - use it where it helps, but don't force it everywhere
- ✅ **Start small** - maybe just import the Firestore paths first
- ✅ **The mobile app runs independently** - it's just co-located for easier development

## Troubleshooting

### Metro bundler can't resolve @plately/shared

If you get "Unable to resolve module @plately/shared":

1. Make sure you've run `pnpm install` in the workspace root
2. Try clearing Metro cache: `npx expo start -c` or `npx react-native start --reset-cache`
3. Verify the package exists: `ls ../packages/shared`

### TypeScript errors

If TypeScript complains about the shared package:

1. Build the shared package: `cd ../../packages/shared && pnpm build`
2. Restart your editor/TypeScript server
