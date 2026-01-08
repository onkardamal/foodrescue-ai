import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration - can be from environment or use defaults
const getFirebaseConfig = () => {
  // Try to parse from environment variable first
  if (process.env.FIREBASE_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_CONFIG);
    } catch (e) {
      console.warn('Failed to parse FIREBASE_CONFIG from env');
    }
  }

  // Default configuration for gen-lang-client-0558617691
  // These should be replaced with actual values from Firebase Console
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyReplaceWithReal",
    authDomain: "gen-lang-client-0558617691.firebaseapp.com",
    projectId: "gen-lang-client-0558617691",
    storageBucket: "gen-lang-client-0558617691.appspot.com",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123"
  };
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(getFirebaseConfig());
  auth = getAuth(app);
  db = getFirestore(app);

  // Connect to emulators in development if configured
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firebase Emulators');
    } catch (error) {
      console.warn('Firebase Emulator connection failed:', error);
    }
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
export default app;
