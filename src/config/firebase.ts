import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration - using real credentials
// NOTE: To avoid Cloud Build / env mismatches causing invalid API key errors,
// we use this single source of truth config. If you rotate keys, update here.
const getFirebaseConfig = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (getApps().length === 0) {
    const config = getFirebaseConfig();
    if (!config.apiKey) {
      console.warn('Firebase API key missing; skipping init.');
    } else {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    console.log('✅ Firebase initialized successfully');

    // Connect to emulators in development if configured
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        if (auth) connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        if (db) connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Connected to Firebase Emulators');
      } catch (error) {
        console.warn('Firebase Emulator connection failed:', error);
      }
    }
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.warn('⚠️ Firebase will not be available. App will use fallback authentication.');
  // Don't throw - allow app to continue with fallback
}

export { app, auth, db, storage };
export default app;
