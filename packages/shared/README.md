# @plately/shared

Shared TypeScript types, constants, and utilities for PlatelyAI web and mobile apps.

## Purpose

This package provides:
- **Firestore Path Constants**: Canonical UID-based paths for all collections
- **Type Definitions**: Shared interfaces for inventory, scans, meals, and user data
- **Zero Runtime Logic**: Types and constants only - no behavior that could break existing apps

## Structure

```
src/
├── firestore/
│   └── paths.ts          # Firestore collection paths
├── models/
│   ├── inventory.ts      # Inventory types
│   ├── scans.ts          # Scan types
│   ├── meals.ts          # Meal types
│   └── user.ts           # User entitlements types
└── index.ts              # Main exports
```

## Usage

### Web App (TypeScript)
```typescript
import { getPaths, InventoryItem } from '@plately/shared';

const paths = getPaths(uid);
const inventoryRef = doc(db, paths.inventory.current);
```

### Mobile App (React Native)
```typescript
import { getPaths, type Meal } from '@plately/shared';

const paths = getPaths(userId);
const mealRef = doc(db, paths.meals.generated(mealId));
```

## Building

```bash
# Build once
pnpm build

# Watch mode (for development)
pnpm dev
```

## Important Notes

- ⚠️ **This package contains NO runtime logic** - only types and path constants
- ⚠️ **Safe to import** - won't change behavior of existing web or backend code
- ⚠️ **TypeScript only** - JavaScript projects can ignore types and use paths
