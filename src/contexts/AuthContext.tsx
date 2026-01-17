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

// Check if Firebase is available
let firebaseAvailable = false;
try {
  if (auth && db) {
    firebaseAvailable = true;
  }
} catch (error) {
  console.warn('Firebase not available:', error);
  firebaseAvailable = false;
}

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
      // Try to load from Firestore, but don't fail if Firestore is not available
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
          return;
        }
      } catch (firestoreError) {
        console.warn('Firestore not available, using Firebase Auth data only:', firestoreError);
        // Fall through to use Firebase Auth data
      }

      // Create user document if it doesn't exist (only if Firestore is available)
      try {
        const newUser = firebaseUserToUser(firebaseUser);
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setUserData(newUser);
      } catch (firestoreError) {
        // If Firestore fails, just use Firebase Auth data
        console.warn('Could not create Firestore document, using Firebase Auth data:', firestoreError);
        setUserData(firebaseUserToUser(firebaseUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Always fallback to Firebase Auth data
      setUserData(firebaseUserToUser(firebaseUser));
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, name: string) => {
    if (!firebaseAvailable || !auth) {
      // Fallback to AuthService
      const state = await AuthService.signup(name, email, password);
      setUserData(state.user);
      return;
    }

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

      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (firestoreError) {
        console.warn('Firestore error during signup, continuing:', firestoreError);
      }

      setUserData(userData);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    // Check for demo account first - use AuthService for demo
    if (email === 'demo@ecotable.dev' && password === 'password123') {
      const demoAuthState = await AuthService.login(email, password);
      // Set userData from demo account
      if (demoAuthState.user) {
        setUserData(demoAuthState.user);
      }
      return;
    }

    if (!firebaseAvailable || !auth) {
      // Fallback to AuthService
      const state = await AuthService.login(email, password);
      setUserData(state.user);
      return;
    }

    try {
      // Use Firebase Auth for real accounts
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!firebaseAvailable || !auth) {
      throw new Error('Firebase Auth is not available. Please use demo accounts or configure Firebase.');
    }

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

      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (firestoreError) {
        console.warn('Firestore error during Google signin, continuing:', firestoreError);
      }

      setUserData(userData);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (firebaseAvailable && auth) {
        await signOut(auth);
      }
      setUserData(null);
      setCurrentUser(null);
      // Also clear local AuthService session
      await AuthService.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails, clear local state
      setUserData(null);
      setCurrentUser(null);
      await AuthService.logout();
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    if (!firebaseAvailable || !auth) {
      throw new Error('Password reset is only available with Firebase Auth. Please configure Firebase.');
    }

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
    let mounted = true;

    // Subscribe to AuthService for demo/local auth updates
    const unsubscribeAuthService = AuthService.subscribe((state) => {
      if (!mounted) return;
      if (state.user) {
        setUserData(state.user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    // Check for demo account first
    const session = localStorage.getItem('savebite_session');
    if (session) {
      try {
        const authState = JSON.parse(session);
        if (authState.isAuthenticated && authState.user) {
          setUserData(authState.user);
          setLoading(false);
          // Don't set up Firebase listener if demo account is active
          if (!firebaseAvailable) {
            return () => { mounted = false; };
          }
        }
      } catch (e) {
        // Invalid session, continue
      }
    }

    // Only set up Firebase listener if Firebase is available
    if (!firebaseAvailable) {
      setLoading(false);
      return () => { mounted = false; };
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!mounted) return;
        
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
                if (mounted) setLoading(false);
                return;
              }
            } catch (e) {
              // Invalid session, continue
            }
          }
          setUserData(null);
        }
        
        if (mounted) setLoading(false);
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      // If Firebase Auth fails, check for demo account
      const session = localStorage.getItem('savebite_session');
      if (session) {
        try {
          const authState = JSON.parse(session);
          if (authState.isAuthenticated && authState.user) {
            setUserData(authState.user);
          }
        } catch (e) {
          // Invalid session
        }
      }
      setLoading(false);
      return () => { mounted = false; unsubscribeAuthService(); };
    }
    return () => { mounted = false; unsubscribeAuthService(); };
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
