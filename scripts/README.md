# Firestore Schema Migration

This directory contains scripts for migrating your Firestore data to the new canonical schema.

## Prerequisites

1. **Service Account Key**: Download your Firebase service account key from:
   - Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   - Save as `serviceAccountKey.json` (DO NOT commit this file!)

2. **Set Environment Variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/serviceAccountKey.json"
   ```

## Usage

### Dry Run (Preview Changes)
```bash
cd scripts
npm install
npm run migrate:dry-run
```

This will show you what would be migrated without making any changes.

### Live Migration
```bash
npm run migrate
```

This will perform the actual migration.

## What Gets Migrated

### Old Schema → New Schema

**OLD:**
```
inventories/{uid}/current/data
  ├── items: [{id, name, category, ...}]
  ├── lastScan: {photoUrl, scannedAt}
  └── updatedAt
```

**NEW:**
```
inventories/{uid}                    ← Parent document
  ├── createdAt
  ├── updatedAt
  ├── lastScannedAt
  ├── itemsCount
  └── source
  
inventories/{uid}/items/{itemId}     ← Subcollection
  ├── name
  ├── category
  ├── quantity
  ├── unit
  ├── source (ai|user)
  ├── confidence
  ├── createdAt
  └── updatedAt
```

## Safety Features

✅ **Idempotent**: Safe to run multiple times
✅ **Dry-run mode**: Preview changes before applying
✅ **Migration markers**: Skips already migrated documents
✅ **Batch operations**: Efficient database writes
✅ **Error handling**: Continues on individual failures

## After Migration

1. **Deploy new Firestore rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Test the application**:
   - Verify inventory items display correctly
   - Test adding new items
   - Test scanning workflow

3. **Monitor for errors**:
   - Check Firebase Console for any issues
   - Review application logs

## Rollback

The migration does NOT delete old data. If needed, you can manually restore by:
1. Reading from `inventories/{uid}/current/data`
2. The old data remains intact

## Environment Variables

- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account key (recommended)
- `FIREBASE_SERVICE_ACCOUNT`: Service account JSON as string (alternative)

## Troubleshooting

### "Missing Firebase credentials"
→ Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### "Permission denied"
→ Ensure service account has Firestore admin permissions

### "Already migrated"
→ Document was already migrated (safe to ignore)

## Need Help?

Check the script output for detailed logs and error messages.
