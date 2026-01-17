import * as admin from 'firebase-admin'

let app: admin.app.App

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]
  }

  try {
    // Option 1: Use service account key from env (base64 encoded)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
      )
      
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    }

    // Option 2: Use application default credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      })
    }

    // Option 3: For development, try application default credentials
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
    throw new Error('Failed to initialize Firebase Admin SDK')
  }
}

if (!app) {
  app = initializeFirebaseAdmin()
}

export const adminAuth = app.auth()
export const adminDb = app.firestore()
export const adminStorage = app.storage()
export { app as adminApp }
