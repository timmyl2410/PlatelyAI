// Firebase Admin SDK initialization for Netlify Functions
// IMPORTANT: This file should NEVER be imported by frontend code (src/)
// It contains admin secrets and should only be used by backend Netlify Functions

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
  // Convert escaped newlines to actual newlines for PEM format
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  const rawBucket = getEnv('FIREBASE_STORAGE_BUCKET');
  const storageBucket = rawBucket
    .trim()
    .replace(/^gs:\/\//, '')
    .replace(/\/+$/, '');

  // Detailed logging for debugging
  console.log('🔍 Firebase Admin env check:');
  console.log('  FIREBASE_PROJECT_ID:', projectId ? '✓ Set' : '✗ Missing');
  console.log('  FIREBASE_CLIENT_EMAIL:', clientEmail ? '✓ Set' : '✗ Missing');
  console.log('  FIREBASE_PRIVATE_KEY:', rawPrivateKey ? `✓ Set (${rawPrivateKey.length} chars)` : '✗ Missing');
  console.log('  FIREBASE_STORAGE_BUCKET:', storageBucket ? '✓ Set' : '✗ Missing');

  if (!projectId || !clientEmail || !rawPrivateKey || !storageBucket) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!rawPrivateKey) missing.push('FIREBASE_PRIVATE_KEY');
    if (!storageBucket) missing.push('FIREBASE_STORAGE_BUCKET');
    
    throw new Error(
      `Missing Firebase Admin env vars: ${missing.join(', ')}. Set these in Netlify Dashboard → Site configuration → Environment variables with "Functions" scope enabled.`
    );
  }

  // Common misconfiguration: pasting the private key across multiple lines
  if (rawPrivateKey.includes('BEGIN PRIVATE KEY') && !rawPrivateKey.includes('END PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY looks truncated. It must be a SINGLE LINE with escaped newlines (\\n), usually wrapped in quotes.'
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

export { admin };
