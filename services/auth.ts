import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  deleteUser,
  User as FirebaseUser
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { User, AuthState } from '../types';

// Helper to map Firebase User to our App User type
export const mapFirebaseUser = (fbUser: FirebaseUser): User => ({
  id: fbUser.uid,
  name: fbUser.displayName || 'Eco Chef',
  email: fbUser.email || '',
  avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`
});

export const AuthService = {
  // Auth state changes are handled via onAuthStateChanged in App.tsx
  // This service now exposes actions.

  signup: async (name: string, email: string, password: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    });
    
    // Initialize empty stats document
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      stats: {
        mealsSaved: 0,
        co2Saved: 0,
        moneySaved: 0,
        donationsCompleted: 0,
        streakDays: 0,
        level: 1,
        xp: 0,
        earnedBadges: [],
        history: []
      }
    });
  },

  login: async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  },

  loginWithGoogle: async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Ensure user stats doc exists on first Google login
    // We use merge: true so we don't overwrite if it exists
    await setDoc(doc(db, 'users', result.user.uid), {
      stats: {
        mealsSaved: 0,
        co2Saved: 0,
        moneySaved: 0,
        donationsCompleted: 0,
        streakDays: 0,
        level: 1,
        xp: 0,
        earnedBadges: [],
        history: []
      }
    }, { merge: true });
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  deleteAccount: async (): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
      await deleteDoc(doc(db, 'users', user.uid));
      // Note: Subcollections (inventory) are not automatically deleted in Firestore client-side.
      // In a production app, use a Cloud Function to handle recursive delete.
      await deleteUser(user);
    }
  }
};
