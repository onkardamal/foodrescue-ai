
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FoodItem, UserStats, Recipe, FoodCategory, Theme, User } from './types';
import { AuthService } from './services/auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthGuard } from './components/AuthGuard';

import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Donation from './components/Donation';
import NGOMap from './components/NGOMap';
import Analytics from './components/Analytics';
import Badges from './components/Badges';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import { Login, Signup } from './components/Auth';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';

// Verify AuthService is available
if (!AuthService || typeof AuthService.init !== 'function') {
  console.error('Critical: AuthService is not properly imported');
}

// --- MOCK DATA: For Demo User Only ---
const MOCK_INVENTORY: FoodItem[] = [
  { id: "m1", name: "Ground Beef Patty", category: FoodCategory.MEAT, quantity: 1, unit: "pcs", expiryDate: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'active', condition: 'Expired' },
  { id: "m2", name: "Tomato Slice", category: FoodCategory.PRODUCE, quantity: 4, unit: "pcs", expiryDate: new Date(Date.now() + 1 * 86400000).toISOString(), status: 'active', condition: 'Ripe' },
  { id: "m3", name: "Sesame Seed Buns", category: FoodCategory.BAKERY, quantity: 2, unit: "pcs", expiryDate: new Date(Date.now() + 3 * 86400000).toISOString(), status: 'active', condition: 'Good' },
  { id: "m4", name: "Cheddar Cheese", category: FoodCategory.DAIRY, quantity: 1, unit: "pack", expiryDate: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'active', condition: 'Good' },
  { id: "m5", name: "Iceberg Lettuce", category: FoodCategory.PRODUCE, quantity: 1, unit: "head", expiryDate: new Date(Date.now() + 2 * 86400000).toISOString(), status: 'active', condition: 'Fresh' },
  { id: "m6", name: "Mayonnaise Jar", category: FoodCategory.OTHER, quantity: 1, unit: "jar", expiryDate: new Date(Date.now() + 60 * 86400000).toISOString(), status: 'active', condition: 'Good' }
];

const MOCK_STATS: UserStats = {
  mealsSaved: 145,
  co2Saved: 320.5,
  moneySaved: 4500,
  donationsCompleted: 24,
  streakDays: 12,
  level: 8,
  xp: 8450,
  earnedBadges: ['b1', 'b2', 'b3', 'b4'],
  history: [
    { id: 'h1', foodName: 'Bulk Potato Sacks (10kg)', date: 'Jan 15, 2:00 PM', ngoName: 'City Care Food Bank', status: 'completed', points: 500 },
    { id: 'h2', foodName: 'Organic Tomato Crate', date: 'Jan 22, 10:30 AM', ngoName: 'Helping Hands Shelter', status: 'completed', points: 350 }
  ]
};

// --- INITIAL STATES: For Genuie New Users ---
const EMPTY_STATS: UserStats = {
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

const AppContent = ({ stats, inventory, recipes, handleLogout, handleAddItem, handleUpdateStatus, handleDeleteItem, handleEditItem, handleCookRecipe, handleUpdateRecipes, handleDonateComplete, handleUpdateStats }: any) => {
  const { authState } = useAuth();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => { if (mainRef.current) mainRef.current.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark font-sans text-slate-800 dark:text-slate-100 flex transition-colors duration-300">
      <Sidebar user={authState.user} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] h-screen overflow-hidden">
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-[90px] md:pb-0 scroll-smooth relative">
          <div className="w-full max-w-[1280px] mx-auto md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard user={authState.user} stats={stats} inventory={inventory} />} />
              <Route path="/inventory" element={<Inventory items={inventory} onAddItem={handleAddItem} onUpdateStatus={handleUpdateStatus} onDeleteItem={handleDeleteItem} onEditItem={handleEditItem} />} />
              <Route path="/recipes" element={<Recipes inventory={inventory} recipes={recipes} onUpdateRecipes={handleUpdateRecipes} onCookRecipe={handleCookRecipe} />} />
              <Route path="/donate" element={<Donation inventory={inventory} onDonateComplete={handleDonateComplete} />} />
              <Route path="/ngos" element={<NGOMap />} />
              <Route path="/analytics" element={<Analytics stats={stats} />} />
              <Route path="/badges" element={<Badges stats={stats} />} />
              <Route path="/leaderboard" element={<Leaderboard user={authState.user} stats={stats} />} />
              <Route path="/profile" element={<Profile user={authState.user} stats={stats} onLogout={handleLogout} onUpdateStats={handleUpdateStats} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

const AppInner = () => {
  const { authState, logout } = useAuth();
  const [inventory, setInventory] = useState<FoodItem[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // Handle initialization of profile specific data
  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.id) {
      const key = `savebite_data_${authState.user.id}`;
      const storedData = localStorage.getItem(key);

      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setInventory(parsed.inventory || []);
          setStats(parsed.stats || EMPTY_STATS);
        } catch (e) {
          setInventory([]);
          setStats(EMPTY_STATS);
        }
      } else {
        // NO DATA FOUND: First time login for this user
        if (authState.user.email === 'demo@ecotable.dev') {
          // MOCK DATA for Demo User
          setInventory(MOCK_INVENTORY);
          setStats(MOCK_STATS);
        } else {
          // GENUINE DATA (EMPTY) for real new users
          setInventory([]);
          setStats(EMPTY_STATS);
        }
      }
      setIsDataInitialized(true);
    } else {
      // If not authenticated, ensure states are reset
      setInventory([]);
      setStats(EMPTY_STATS);
      setIsDataInitialized(false);
    }
  }, [authState.isAuthenticated, authState.user?.id, authState.user?.email]);

  // Persist data on changes
  useEffect(() => {
    if (isDataInitialized && authState.isAuthenticated && authState.user?.id) {
      const key = `savebite_data_${authState.user.id}`;
      localStorage.setItem(key, JSON.stringify({ inventory, stats }));
    }
  }, [inventory, stats, authState.isAuthenticated, authState.user?.id, isDataInitialized]);

  const handleLogout = async () => {
    try {
      await logout();
      // Force a clean state reset
      setInventory([]);
      setStats(EMPTY_STATS);
      setGeneratedRecipes([]);
      setIsDataInitialized(false);
      // Simple redirect to home
      window.location.hash = '#/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddItem = (item: FoodItem) => setInventory(prev => [item, ...prev]);
  const handleDeleteItem = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));
  const handleEditItem = (updatedItem: FoodItem) => setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

  const handleUpdateStatus = (id: string, status: 'donated' | 'wasted' | 'consumed') => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    if (status === 'donated') {
      setStats(prev => ({ ...prev, mealsSaved: prev.mealsSaved + 1, donationsCompleted: (prev.donationsCompleted || 0) + 1, co2Saved: parseFloat((prev.co2Saved + 0.5).toFixed(1)), moneySaved: prev.moneySaved + 5, xp: prev.xp + 50 }));
    }
  };

  const handleCookRecipe = (recipe: Recipe) => {
    setInventory(prev => prev.map(item => {
      const isUsed = recipe.ingredients.some(ing => ing.toLowerCase().includes(item.name.toLowerCase()));
      return isUsed && item.status === 'active' ? { ...item, status: 'consumed' } : item;
    }));
    setStats(prev => ({ ...prev, mealsSaved: prev.mealsSaved + 1, co2Saved: parseFloat((prev.co2Saved + 0.8).toFixed(1)), moneySaved: prev.moneySaved + 10, xp: prev.xp + 100 }));
  };

  const handleDonateComplete = (itemIds: string[], amount: number) => {
    setInventory(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, status: 'donated' } : item));
    setStats(prev => ({
      ...prev,
      mealsSaved: prev.mealsSaved + itemIds.length,
      donationsCompleted: (prev.donationsCompleted || 0) + 1,
      moneySaved: prev.moneySaved + amount,
      co2Saved: parseFloat((prev.co2Saved + (itemIds.length * 0.5)).toFixed(1)),
      xp: prev.xp + (itemIds.length * 50)
    }));
  };

  const handleUpdateStats = (newStats: UserStats) => setStats(newStats);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/*" element={
          <AuthGuard>
            <AppContent
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
          </AuthGuard>
        } />
      </Routes>
    </HashRouter>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </AuthProvider>
  );
}
