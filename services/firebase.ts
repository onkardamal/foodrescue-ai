import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Parse firebase configuration from environment or use placeholders
const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {
  // Fallback for development if env var is missing (replace with real config in prod)
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "placeholder.firebaseapp.com",
  projectId: "placeholder-id",
  storageBucket: "placeholder.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
