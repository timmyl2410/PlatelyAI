import admin from 'firebase-admin';

const getEnv = (name) => {
  const v = process.env[name];
  return typeof v === 'string' ? v : '';
};

export const getFirebaseAdminApp = () => {
  if (admin.apps?.length) return admin.app();

  const projectId = getEnv('FIREBASE_PROJECT_ID');
  const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
  const rawPrivateKey = getEnv('FIREBASE_PRIVATE_KEY');
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  const rawBucket = getEnv('FIREBASE_STORAGE_BUCKET');
  const storageBucket = rawBucket
    .trim()
    .replace(/^gs:\/\//, '')
    .replace(/\/+$/, '');

  if (!projectId || !clientEmail || !rawPrivateKey || !storageBucket) {
    throw new Error(
      'Missing Firebase Admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET in backend/.env'
    );
  }

  // Common misconfiguration: pasting the private key across multiple lines in .env.
  // dotenv will only read the first line and ignore the rest, producing an invalid PEM.
  if (rawPrivateKey.includes('BEGIN PRIVATE KEY') && !rawPrivateKey.includes('END PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY looks truncated. In backend/.env it must be a SINGLE LINE with escaped newlines (\\n), usually wrapped in quotes.'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  });
};

export const getFirestore = () => {
  return getFirebaseAdminApp().firestore();
};

export const getBucket = () => {
  return getFirebaseAdminApp().storage().bucket();
};

export const getAuth = () => {
  return getFirebaseAdminApp().auth();
};

export { admin };
