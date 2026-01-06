
import { User, AuthState } from '../types';

// Mock Backend Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const USERS_KEY = 'ecotable_users';
const SESSION_KEY = 'ecotable_session';

export const AuthService = {
  // Initialize from storage
  init: (): AuthState => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      return JSON.parse(session);
    }
    return { user: null, token: null, isAuthenticated: false };
  },

  signup: async (name: string, email: string, password: string): Promise<AuthState> => {
    await delay(800); // Simulate network request
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };

    users.push({ ...newUser, password }); // In real app, hash password!
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const authState = { user: newUser, token: 'mock-jwt-token-' + Date.now(), isAuthenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authState));
    
    return authState;
  },

  login: async (email: string, password: string): Promise<AuthState> => {
    await delay(800);
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const { password: _, ...safeUser } = user;
    const authState = { user: safeUser, token: 'mock-jwt-token-' + Date.now(), isAuthenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authState));

    return authState;
  },

  googleLogin: async (userInfo: any): Promise<AuthState> => {
    await delay(500);
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    let user = users.find((u: any) => u.email === userInfo.email);

    if (!user) {
        // Create new user if they don't exist (Signup via Google)
        user = {
            id: userInfo.sub || Math.random().toString(36).substr(2, 9),
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo.name}`
        };
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    const authState = { user, token: 'google-token-' + Date.now(), isAuthenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authState));
    return authState;
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    return { user: null, token: null, isAuthenticated: false };
  }
};
