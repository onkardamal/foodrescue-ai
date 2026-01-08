import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration - using real credentials
const getFirebaseConfig = () => {
  // Try to parse from environment variable first (from vite.config.ts)
  const firebaseConfigEnv = import.meta.env.VITE_FIREBASE_CONFIG || (typeof process !== 'undefined' && process.env?.FIREBASE_CONFIG);
  
  if (firebaseConfigEnv) {
    try {
      const config = typeof firebaseConfigEnv === 'string' ? JSON.parse(firebaseConfigEnv) : firebaseConfigEnv;
      console.log('Firebase config loaded from environment');
      return config;
    } catch (e) {
      console.warn('Failed to parse FIREBASE_CONFIG from env:', e);
    }
  }

  // Try individual environment variables (Vite format)
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && apiKey !== 'AIzaSyDemoKeyReplaceWithReal') {
    console.log('Firebase config loaded from individual env variables');
    return {
      apiKey: apiKey,
      authDomain: authDomain || "gen-lang-client-0558617691.firebaseapp.com",
      projectId: projectId || "gen-lang-client-0558617691",
      storageBucket: storageBucket || "gen-lang-client-0558617691.firebasestorage.app",
      messagingSenderId: messagingSenderId || '',
      appId: appId || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
    };
  }

  // Default configuration with real Firebase credentials
  // Note: These are hardcoded as fallback. For production, use environment variables.
  return {
    apiKey: "AIzaSyBHgDsjCsVGwmdR_yp4Gg7cJXe7K2FeiF0",
    authDomain: "gen-lang-client-0558617691.firebaseapp.com",
    projectId: "gen-lang-client-0558617691",
    storageBucket: "gen-lang-client-0558617691.firebasestorage.app",
    messagingSenderId: "938374868946",
    appId: "1:938374868946:web:725841gd5ed0eb6852629b",
    measurementId: "G-5R9NE49RG0"
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
