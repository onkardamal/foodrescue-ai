
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Home, List, ChefHat, Heart, User, LogOut } from 'lucide-react';
import { FoodItem, UserStats, Recipe, FoodCategory, AuthState } from './types';
import { AuthService } from './services/auth';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Donation from './components/Donation';
import { Login, Signup } from './components/Auth';

// Initial Mock Data (Fallback)
const INITIAL_INVENTORY: FoodItem[] = [
  { id: '1', name: 'Milk', category: FoodCategory.DAIRY, quantity: 1, unit: 'liter', expiryDate: new Date(Date.now() + 2 * 86400000).toISOString(), status: 'active' },
  { id: '2', name: 'Spinach', category: FoodCategory.PRODUCE, quantity: 200, unit: 'g', expiryDate: new Date(Date.now() + 1 * 86400000).toISOString(), status: 'active' },
  { id: '3', name: 'Yogurt', category: FoodCategory.DAIRY, quantity: 2, unit: 'cups', expiryDate: new Date(Date.now() + 5 * 86400000).toISOString(), status: 'active' },
  { id: '4', name: 'Apples', category: FoodCategory.PRODUCE, quantity: 4, unit: 'pc', expiryDate: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'active' }, 
];

const INITIAL_STATS: UserStats = {
  mealsSaved: 24,
  co2Saved: 15.5,
  moneySaved: 120,
  streakDays: 5,
  level: 3,
  xp: 450
};

// Bottom Navigation Component
const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/inventory', icon: List, label: 'Pantry' },
    { path: '/recipes', icon: ChefHat, label: 'Recipes' },
    { path: '/donate', icon: Heart, label: 'Donate' },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/20 pb-safe rounded-2xl z-40 flex justify-between items-center shadow-2xl shadow-slate-200/50 p-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-14 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && <span className="text-[10px] font-bold mt-1 leading-none">{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default function App() {
  const [auth, setAuth] = useState<AuthState>(AuthService.init());
  const [isLoginView, setIsLoginView] = useState(true);
  const [inventory, setInventory] = useState<FoodItem[]>(INITIAL_INVENTORY);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);

  useEffect(() => {
    // Load data from local storage if available to simulate DB
    const storedInventory = localStorage.getItem('ecotable_inventory');
    if (storedInventory) setInventory(JSON.parse(storedInventory));
  }, []);

  useEffect(() => {
    // Persist inventory updates
    if (auth.isAuthenticated) {
        localStorage.setItem('ecotable_inventory', JSON.stringify(inventory));
    }
  }, [inventory, auth.isAuthenticated]);

  const handleLogin = (state: AuthState) => {
    setAuth(state);
  };

  const handleLogout = () => {
    AuthService.logout().then(setAuth);
  };

  // Handlers
  const handleAddItem = (item: FoodItem) => {
    setInventory(prev => [...prev, item]);
  };

  const handleUpdateStatus = (id: string, status: 'donated' | 'wasted') => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    
    // Update Stats
    if (status === 'donated') {
      setStats(prev => ({
        ...prev,
        mealsSaved: prev.mealsSaved + 1,
        co2Saved: parseFloat((prev.co2Saved + 0.5).toFixed(1)),
        moneySaved: prev.moneySaved + 5,
        xp: prev.xp + 50
      }));
    }
  };

  const handleCookRecipe = (recipe: Recipe) => {
    setInventory(prev => prev.map(item => {
      const isUsed = recipe.ingredients.some(ing => ing.toLowerCase().includes(item.name.toLowerCase()));
      return isUsed && item.status === 'active' ? { ...item, status: 'consumed' } : item;
    }));

    setStats(prev => ({
      ...prev,
      mealsSaved: prev.mealsSaved + 1,
      co2Saved: parseFloat((prev.co2Saved + 0.8).toFixed(1)),
      moneySaved: prev.moneySaved + 10,
      xp: prev.xp + 100
    }));
  };

  const handleDonateComplete = (itemIds: string[], amount: number) => {
    setInventory(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, status: 'donated' } : item));
    setStats(prev => ({
        ...prev,
        mealsSaved: prev.mealsSaved + itemIds.length,
        moneySaved: prev.moneySaved + amount,
        co2Saved: parseFloat((prev.co2Saved + (itemIds.length * 0.5)).toFixed(1)),
        xp: prev.xp + (itemIds.length * 50)
    }));
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
        <header className="px-6 py-6 flex justify-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">E</div>
                <h1 className="font-bold text-xl tracking-tight text-slate-800">EcoTable</h1>
            </div>
        </header>
        {isLoginView ? (
          <Login onLogin={handleLogin} onToggle={() => setIsLoginView(false)} />
        ) : (
          <Signup onLogin={handleLogin} onToggle={() => setIsLoginView(true)} />
        )}
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">E</div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">EcoTable</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {stats.xp} XP
            </div>
            <div className="relative group">
                <button className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden hover:ring-2 ring-indigo-100 transition-all">
                    {auth.user?.avatar ? <img src={auth.user.avatar} alt="User" /> : <User className="w-full h-full p-2 text-slate-400" />}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="font-bold text-sm text-slate-800">{auth.user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{auth.user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-2xl mx-auto p-4 md:p-6 min-h-[calc(100vh-140px)]">
          <Routes>
            <Route path="/" element={<Dashboard stats={stats} inventory={inventory} />} />
            <Route path="/inventory" element={
              <Inventory 
                items={inventory} 
                onAddItem={handleAddItem} 
                onUpdateStatus={handleUpdateStatus} 
              />
            } />
            <Route path="/recipes" element={
              <Recipes 
                inventory={inventory} 
                onCookRecipe={handleCookRecipe} 
              />
            } />
            <Route path="/donate" element={
                <Donation 
                    inventory={inventory} 
                    onDonateComplete={handleDonateComplete} 
                />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </HashRouter>
  );
}
