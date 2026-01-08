import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration - using real credentials
// NOTE: To avoid Cloud Build / env mismatches causing invalid API key errors,
// we use this single source of truth config. If you rotate keys, update here.
const getFirebaseConfig = () => {
  return {
    apiKey: "AIzaSyBHgDsjCsVGwmdR_yp4Gg7cJXe7K2FeiFo",
    authDomain: "gen-lang-client-0558617691.firebaseapp.com",
    projectId: "gen-lang-client-0558617691",
    storageBucket: "gen-lang-client-0558617691.firebasestorage.app",
    messagingSenderId: "938374868946",
    appId: "1:938374868946:web:7258416d5ed0eb6852620b",
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
