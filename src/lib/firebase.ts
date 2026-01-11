// Firebase configuration
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, addDoc, getDoc, doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from './firebaseConfig';

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error('Firebase configuration is invalid. Please check your firebaseConfig.ts file.');
}

export { app, db, storage, auth };

// ============================================================================
// REAL-TIME LISTENERS
// ============================================================================
export const subscribeToSession = (
  sessionId: string,
  onData: (data: unknown | null) => void,
  onError?: (error: unknown) => void,
) => {
  const docRef = doc(db, 'sessions', sessionId);

  return onSnapshot(
    docRef,
    (snap) => {
      onData(snap.exists() ? snap.data() : null);
    },
    (error) => {
      console.error('❌ Firestore listener error:', error);
      onError?.(error);
    },
  );
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================
export const createSession = async () => {
  try {
    console.log('🔄 Creating session in Firestore...');
    const docRef = await addDoc(collection(db, 'sessions'), {
      createdAt: new Date(),
      images: []
    });
    console.log('✅ Session created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating session:', error);
    throw error;
  }
};

export const getSession = async (sessionId: string) => {
  try {
    console.log(`🔄 Fetching session with ID: ${sessionId}`);
    const docRef = doc(db, 'sessions', sessionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('✅ Session data:', docSnap.data());
      return docSnap.data();
    } else {
      console.log('❌ No such session found!');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching session:', error);
    throw error;
  }
};

export const addImageToSession = async (sessionId: string, imageUrl: string) => {
  try {
    console.log('🔄 Adding image to session:', sessionId);
    const docRef = doc(db, 'sessions', sessionId);
    await updateDoc(docRef, {
      images: arrayUnion({
        url: imageUrl,
        uploadedAt: new Date()
      })
    });
    console.log('✅ Image added to session');
  } catch (error) {
    console.error('❌ Error adding image to session:', error);
    throw error;
  }
};

// ============================================================================
// IMAGE UPLOAD
// ============================================================================
export const uploadImage = async (file: File, sessionId: string): Promise<string> => {
  try {
    console.log('📤 Uploading image to Firebase Storage...');
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${sessionId}/${timestamp}_${file.name}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, filename);
    console.log('📁 Uploading to path:', filename);
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Image uploaded, URL:', downloadURL);

    // Add to session
    await addImageToSession(sessionId, downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw error;
  }
};


