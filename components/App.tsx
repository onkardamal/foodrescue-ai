import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Home, Package, ChefHat, Heart, MapPin, Leaf, Moon, Sun, User as UserIcon, Loader2 } from 'lucide-react';
import { FoodItem, UserStats, Recipe, FoodCategory, AuthState, ThemeContextType, Theme, User } from '../types';
import { AuthService, mapFirebaseUser } from '../services/auth';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, query, writeBatch } from "firebase/firestore";

import Dashboard from './Dashboard';
import Inventory from './Inventory';
import Recipes from './Recipes';
import Donation from './Donation';
import NGOMap from './NGOMap';
import Analytics from './Analytics';
import Badges from './Badges';
import Leaderboard from './Leaderboard';
import Profile from './Profile';
import { Login, Signup } from './Auth';

// --- Theme Context ---
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const INITIAL_STATS: UserStats = {
  mealsSaved: 0,
  co2Saved: 0,
  moneySaved: 0,
  donationsCompleted: 0,
  streakDays: 0,
  level: 1,
  xp: 0,
  earnedBadges: [],
  history: []
};

// Sidebar for Desktop
const Sidebar = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/recipes', icon: ChefHat, label: 'Recipes' },
    { path: '/donate', icon: Heart, label: 'Donate' },
    { path: '/ngos', icon: MapPin, label: 'NGOs' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] h-screen bg-white dark:bg-slate-900 border-r border-[#EEEEEE] dark:border-slate-800 fixed left-0 top-0 z-50 transition-colors duration-300">
      <div className="p-6 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#00796B] rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-teal-100 dark:shadow-teal-900/20">
           <Leaf size={20} fill="white" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight text-[#212121] dark:text-slate-100">SaveBite</h1>
          <p className="text-[10px] text-[#757575] dark:text-slate-500 font-medium leading-tight">The right choice before waste</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group active:scale-95 ${
                isActive 
                  ? 'bg-[#00796B]/10 text-[#00796B] font-semibold' 
                  : 'text-[#757575] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm dark:hover:shadow-none'
              }`}
            >
              <item.icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-[#00796B]' : 'text-[#757575] dark:text-slate-400 group-hover:text-[#212121] dark:group-hover:text-slate-200'}
              />
              <span className={isActive ? 'text-[#00796B]' : 'text-[#757575] dark:text-slate-400 group-hover:text-[#212121] dark:group-hover:text-slate-200'} >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#EEEEEE] dark:border-slate-800 space-y-2">
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#757575] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm active:scale-95 transition-all w-full mb-2"
        >
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <NavLink 
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <img 
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} 
            alt="Profile" 
            className="w-10 h-10 rounded-full bg-slate-200" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#212121] dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-[#757575] dark:text-slate-400 truncate">View Profile</p>
          </div>
          <UserIcon size={16} className="text-slate-400" />
        </NavLink>
      </div>
    </aside>
  );
};

// Bottom Navigation Component (Mobile Only)
const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/recipes', icon: ChefHat, label: 'Recipes' },
    { path: '/donate', icon: Heart, label: 'Donate' },
    { path: '/ngos', icon: MapPin, label: 'NGOs' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-white dark:bg-slate-900 border-t border-[rgba(33,33,33,0.04)] dark:border-slate-800 z-[100] flex justify-around items-start pt-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)] transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center w-[60px] relative group active:scale-90 transition-transform"
          >
            {isActive && (
              <div className="absolute -top-3 w-[32px] h-[3px] bg-[#00796B] rounded-b-[2px] shadow-[0_2px_8px_#00796B80]"></div>
            )}
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
               <item.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#00796B' : undefined}
                className={!isActive ? 'text-[#757575] dark:text-slate-500' : ''}
                />
            </div>
            <span 
              className={`text-[10px] font-medium mt-[4px] leading-none transition-colors ${isActive ? 'text-[#00796B]' : 'text-[#757575] dark:text-slate-500'}`}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

const AppContent = ({ auth, stats, inventory, recipes, handleLogout, handleAddItem, handleUpdateStatus, handleDeleteItem, handleEditItem, handleCookRecipe, handleUpdateRecipes, handleDonateComplete, handleUpdateStats }: any) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 font-sans text-[#212121] dark:text-slate-100 flex transition-colors duration-300">
      <Sidebar user={auth.user} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[240px] h-screen overflow-hidden">
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-[90px] md:pb-0 scroll-smooth">
          <div className="w-full max-w-[1200px] mx-auto md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard user={auth.user} stats={stats} inventory={inventory} />} />
              <Route path="/inventory" element={
                 <Inventory 
                    items={inventory} 
                    onAddItem={handleAddItem} 
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteItem={handleDeleteItem}
                    onEditItem={handleEditItem}
                  />
              } />
              <Route path="/recipes" element={
                  <Recipes 
                    inventory={inventory} 
                    recipes={recipes}
                    onUpdateRecipes={handleUpdateRecipes}
                    onCookRecipe={handleCookRecipe} 
                  />
              } />
              <Route path="/donate" element={
                  <Donation 
                      inventory={inventory} 
                      onDonateComplete={handleDonateComplete} 
                  />
              } />
               <Route path="/ngos" element={<NGOMap />} />
               <Route path="/analytics" element={<Analytics stats={stats} />} />
               <Route path="/badges" element={<Badges stats={stats} />} />
               <Route path="/leaderboard" element={<Leaderboard user={auth.user} stats={stats} />} />
               <Route path="/profile" element={
                 <Profile 
                    user={auth.user} 
                    stats={stats} 
                    onLogout={handleLogout} 
                    onUpdateStats={handleUpdateStats}
                 />
               } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, token: null, isAuthenticated: false });
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [inventory, setInventory] = useState<FoodItem[]>([]);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // --- 1. Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState({
          user: mapFirebaseUser(user),
          token: 'firebase-token', // We don't need actual token for this simple logic
          isAuthenticated: true
        });
      } else {
        setAuthState({ user: null, token: null, isAuthenticated: false });
        setInventory([]);
        setStats(INITIAL_STATS);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. Firestore Data Listeners (Inventory & Stats) ---
  useEffect(() => {
    if (!authState.user) return;

    // A. Stats Listener
    const statsUnsub = onSnapshot(doc(db, 'users', authState.user.id), (docSnap) => {
      if (docSnap.exists() && docSnap.data().stats) {
        setStats(docSnap.data().stats as UserStats);
      } else {
        // Doc might not exist yet if simple signup, wait or set defaults
        setStats(INITIAL_STATS);
      }
    });

    // B. Inventory Listener (Subcollection)
    const inventoryQuery = query(collection(db, 'users', authState.user.id, 'inventory'));
    const inventoryUnsub = onSnapshot(inventoryQuery, (querySnap) => {
      const items: FoodItem[] = [];
      querySnap.forEach((d) => {
        items.push(d.data() as FoodItem);
      });
      setInventory(items);
    });

    return () => {
      statsUnsub();
      inventoryUnsub();
    };
  }, [authState.user]);

  // --- Theme Logic ---
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await AuthService.logout();
    window.location.reload();
  };

  // --- Firestore Action Handlers ---

  const handleAddItem = async (item: FoodItem) => {
    if (!authState.user) return;
    await setDoc(doc(db, 'users', authState.user.id, 'inventory', item.id), item);
  };

  const handleDeleteItem = async (id: string) => {
    if (!authState.user) return;
    await deleteDoc(doc(db, 'users', authState.user.id, 'inventory', id));
  };

  const handleEditItem = async (updatedItem: FoodItem) => {
    if (!authState.user) return;
    await setDoc(doc(db, 'users', authState.user.id, 'inventory', updatedItem.id), updatedItem, { merge: true });
  };

  const handleUpdateStatus = async (id: string, status: 'donated' | 'wasted' | 'consumed') => {
    if (!authState.user) return;
    
    // 1. Update Inventory Item
    await updateDoc(doc(db, 'users', authState.user.id, 'inventory', id), { status });
    
    // 2. Update Stats (only for donated case here, similar logic for others if needed)
    if (status === 'donated') {
        const newStats = {
            ...stats,
            mealsSaved: stats.mealsSaved + 1,
            co2Saved: parseFloat((stats.co2Saved + 0.5).toFixed(1)),
            moneySaved: stats.moneySaved + 5,
            xp: stats.xp + 50
        };
        await updateDoc(doc(db, 'users', authState.user.id), { stats: newStats });
    }
  };

  const handleCookRecipe = async (recipe: Recipe) => {
     if (!authState.user) return;
     
     const batch = writeBatch(db);
     
     // 1. Mark items consumed
     inventory.forEach(item => {
        const isUsed = recipe.ingredients.some(ing => ing.toLowerCase().includes(item.name.toLowerCase()));
        if (isUsed && item.status === 'active') {
             const ref = doc(db, 'users', authState.user.id, 'inventory', item.id);
             batch.update(ref, { status: 'consumed' });
        }
     });

     // 2. Update Stats
     const newStats = {
         ...stats,
         mealsSaved: stats.mealsSaved + 1,
         co2Saved: parseFloat((stats.co2Saved + 0.8).toFixed(1)),
         moneySaved: stats.moneySaved + 10,
         xp: stats.xp + 100
     };
     const userRef = doc(db, 'users', authState.user.id);
     batch.update(userRef, { stats: newStats });

     await batch.commit();
  };

  const handleDonateComplete = async (itemIds: string[], amount: number) => {
    if (!authState.user) return;
    const batch = writeBatch(db);

    // 1. Update items
    itemIds.forEach(id => {
        const ref = doc(db, 'users', authState.user.id, 'inventory', id);
        batch.update(ref, { status: 'donated' });
    });

    // 2. Update Stats
    const newStats = {
        ...stats,
        mealsSaved: stats.mealsSaved + itemIds.length,
        moneySaved: stats.moneySaved + amount,
        co2Saved: parseFloat((stats.co2Saved + (itemIds.length * 0.5)).toFixed(1)),
        xp: stats.xp + (itemIds.length * 50)
    };
    const userRef = doc(db, 'users', authState.user.id);
    batch.update(userRef, { stats: newStats });

    await batch.commit();
  };

  const handleUpdateStats = async (newStats: UserStats) => {
      if (!authState.user) return;
      await updateDoc(doc(db, 'users', authState.user.id), { stats: newStats });
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#00796B]" size={40} />
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return isLoginView ? (
      <Login onLogin={() => {}} onToggle={() => setIsLoginView(false)} />
    ) : (
      <Signup onLogin={() => {}} onToggle={() => setIsLoginView(true)} />
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <HashRouter>
        <AppContent 
          auth={authState}
          stats={stats}
          inventory={inventory}
          recipes={generatedRecipes}
          handleLogout={handleLogout}
          handleAddItem={handleAddItem}
          handleDeleteItem={handleDeleteItem}
          handleUpdateStatus={handleUpdateStatus}
          handleEditItem={handleEditItem}
          handleCookRecipe={handleCookRecipe}
          handleUpdateRecipes={setGeneratedRecipes}
          handleDonateComplete={handleDonateComplete}
          handleUpdateStats={handleUpdateStats}
        />
      </HashRouter>
    </ThemeContext.Provider>
  );
}
