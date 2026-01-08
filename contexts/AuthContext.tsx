import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, AuthState } from '../types';
import { AuthService } from '../services/auth';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  authState: AuthState;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Firebase user to our User type
  const firebaseUserToUser = (firebaseUser: FirebaseUser): User => {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
    };
  };

  // Load user data from Firestore
  const loadUserData = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: data.name || firebaseUser.displayName || '',
          avatar: data.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
        });
      } else {
        // Create user document if it doesn't exist
        const newUser = firebaseUserToUser(firebaseUser);
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setUserData(newUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(firebaseUserToUser(firebaseUser));
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      const userData: User = {
        id: user.uid,
        email: user.email || '',
        name: name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setUserData(userData);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      // Check for demo account first - use AuthService for demo
      if (email === 'demo@ecotable.dev' && password === 'password123') {
        const demoAuthState = await AuthService.login(email, password);
        // Set userData from demo account
        if (demoAuthState.user) {
          setUserData(demoAuthState.user);
        }
        return;
      }

      // Use Firebase Auth for real accounts
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create or update user document
      const userData: User = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setUserData(userData);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      // Also clear local AuthService session
      await AuthService.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to logout');
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      await updateProfile(currentUser, updates);
      
      // Update Firestore
      if (userData) {
        const updatedUserData = {
          ...userData,
          name: updates.displayName || userData.name,
          avatar: updates.photoURL || userData.avatar,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', currentUser.uid), updatedUserData, { merge: true });
        setUserData(updatedUserData);
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        // Check if there's a demo account session
        const session = localStorage.getItem('savebite_session');
        if (session) {
          try {
            const authState = JSON.parse(session);
            if (authState.isAuthenticated && authState.user) {
              setUserData(authState.user);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Invalid session, continue
          }
        }
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Also check for demo account on mount
    const session = localStorage.getItem('savebite_session');
    if (session) {
      try {
        const authState = JSON.parse(session);
        if (authState.isAuthenticated && authState.user && !currentUser) {
          setUserData(authState.user);
        }
      } catch (e) {
        // Invalid session
      }
    }

    return unsubscribe;
  }, []);

  // Get auth state - check both Firebase and demo account
  const getAuthState = (): AuthState => {
    if (currentUser && userData) {
      return {
        user: userData,
        token: null, // Token will be retrieved async when needed
        isAuthenticated: true
      };
    }
    
    // Check for demo account session
    const session = localStorage.getItem('savebite_session');
    if (session) {
      try {
        const authState = JSON.parse(session);
        if (authState.isAuthenticated && authState.user) {
          return authState;
        }
      } catch (e) {
        // Invalid session
      }
    }
    
    return {
      user: null,
      token: null,
      isAuthenticated: false
    };
  };

  const authState = getAuthState();

  const value: AuthContextType = {
    currentUser,
    userData,
    authState,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
