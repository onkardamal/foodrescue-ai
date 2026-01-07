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

  login: async (email: string, password: string): Promise<AuthState> => {
    await delay(800);
    
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
    
    // Demo account logic
    if (email === 'demo@ecotable.dev' && password === 'password123') {
        if (deletedIds.includes('demo_user_id_fixed')) {
            throw new Error('This account has been deleted.');
        }
        const demoUser: User = {
            id: 'demo_user_id_fixed',
            name: 'Eco Chef',
            email: 'demo@ecotable.dev',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EcoChef'
        };
        
        AuthService.syncToMockPicker(demoUser);
        
        const authState = { user: demoUser, token: 'demo-token', isAuthenticated: true };
        localStorage.setItem(SESSION_KEY, JSON.stringify(authState));
        notifySubscribers(authState);
        return authState;
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user || deletedIds.includes(user.id)) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...safeUser } = user;
    
    // Ensure this account shows up in the mock picker too
    AuthService.syncToMockPicker(safeUser);

    const authState = { user: safeUser, token: 'jwt-' + Date.now(), isAuthenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authState));

    notifySubscribers(authState);
    return authState;
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    const authState = { user: null, token: null, isAuthenticated: false };
    notifySubscribers(authState);
    return authState;
  },

  deleteAccount: async (userId: string) => {
    await delay(1000);
    
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
    if (!deletedIds.includes(userId)) {
        deletedIds.push(userId);
        localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const filteredUsers = users.filter((u: any) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));

    const googleMocks = JSON.parse(localStorage.getItem(GOOGLE_MOCKS_KEY) || '[]');
    const filteredMocks = googleMocks.filter((u: any) => u.id !== userId);
    localStorage.setItem(GOOGLE_MOCKS_KEY, JSON.stringify(filteredMocks));

    localStorage.removeItem(`savebite_data_${userId}`);

    await AuthService.logout();
  }
};