# Firebase Setup Guide

## 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project" or "Add project"
3. Name it "platify-qr-upload" or similar
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Firestore Database
1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (us-central1 is fine)
5. Click "Done"

## 3. Enable Storage
1. Click "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode"
4. Click "Done"

## 4. Get Your Config Values
1. Click the gear icon → "Project settings"
2. Scroll down to "Your apps" section
3. Click the "</>" icon to add a web app
4. Register your app (name: "Platify")
5. Copy the `firebaseConfig` object values

## 5. Update Your Code
1. Open `src/lib/firebaseConfig.ts`
2. Replace the placeholder values with your real Firebase config
3. Save the file

## 6. Security Rules (Optional but Recommended)
In Firebase Console, update Firestore and Storage rules to be more secure:

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null || request.time < timestamp.date(2026, 12, 31);
    }
  }
}
```

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null || request.time < timestamp.date(2026, 12, 31);
    }
  }
}
```

## 7. Test It!
- Run `npm run dev`
- Try the QR code upload flow
- Check Firebase Console to see your data