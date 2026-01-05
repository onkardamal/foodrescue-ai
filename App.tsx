import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Home, Package, ChefHat, Heart, MapPin, LogOut, Menu, Leaf, Moon, Sun } from 'lucide-react';
import { FoodItem, UserStats, Recipe, FoodCategory, AuthState, ThemeContextType, Theme } from './types';
import { AuthService } from './services/auth';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Donation from './components/Donation';
import NGOMap from './components/NGOMap';
import Analytics from './components/Analytics';
import { Login, Signup } from './components/Auth';

// --- Theme Context ---
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Initial Mock Data
const INITIAL_INVENTORY: FoodItem[] = [
  { 
    id: "1", 
    name: "Ground Beef Patty", 
    category: FoodCategory.MEAT, 
    quantity: 1, 
    unit: "pieces", 
    expiryDate: new Date(Date.now() - 2 * 86400000).toISOString(), // Expired
    status: 'active',
    condition: 'Expired'
  },
  { 
    id: "2", 
    name: "Tomato Slice", 
    category: FoodCategory.PRODUCE, 
    quantity: 1, 
    unit: "pieces", 
    expiryDate: new Date(Date.now() + 4 * 86400000).toISOString(), // Expires in 4 days
    status: 'active',
    condition: 'Expiring Soon'
  },
  { 
    id: "3", 
    name: "Sesame Seed Bun", 
    category: FoodCategory.BAKERY, 
    quantity: 1, 
    unit: "pieces", 
    expiryDate: new Date(Date.now() + 6 * 86400000).toISOString(), 
    status: 'active',
    condition: 'Good'
  },
  { 
    id: "4", 
    name: "Cheddar Cheese Slice", 
    category: FoodCategory.DAIRY, 
    quantity: 1, 
    unit: "pieces", 
    expiryDate: new Date(Date.now() + 6 * 86400000).toISOString(), 
    status: 'active',
    condition: 'Good'
  },
  { 
    id: "5", 
    name: "Lettuce", 
    category: FoodCategory.PRODUCE, 
    quantity: 20, 
    unit: "grams", 
    expiryDate: new Date(Date.now() + 6 * 86400000).toISOString(), 
    status: 'active',
    condition: 'Good'
  },
  { 
    id: "6", 
    name: "Mayonnaise", 
    category: FoodCategory.OTHER, 
    quantity: 10, 
    unit: "grams", 
    expiryDate: "2026-02-03T00:00:00.000Z", 
    status: 'active',
    condition: 'Good'
  },
  { 
    id: "7", 
    name: "Ketchup", 
    category: FoodCategory.OTHER, 
    quantity: 10, 
    unit: "grams", 
    expiryDate: "2026-02-03T00:00:00.000Z", 
    status: 'active',
    condition: 'Good'
  }
];

const INITIAL_STATS: UserStats = {
  mealsSaved: 124,
  co2Saved: 58,
  moneySaved: 340,
  streakDays: 12,
  level: 5,
  xp: 850
};

// Sidebar for Desktop
const Sidebar = ({ handleLogout }: { handleLogout: () => void }) => {
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
        <div className="w-10 h-10 bg-[#1CAE9E] rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-teal-100 dark:shadow-teal-900/20">
           <Leaf size={20} fill="white" />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-[#212121] dark:text-slate-100">FoodSaver</h1>
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
                  ? 'bg-[#1CAE9E]/10 text-[#1CAE9E] font-semibold' 
                  : 'text-[#757575] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm dark:hover:shadow-none'
              }`}
            >
              <item.icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-[#1CAE9E]' : 'text-[#757575] dark:text-slate-400 group-hover:text-[#212121] dark:group-hover:text-slate-200'}
              />
              <span className={isActive ? 'text-[#1CAE9E]' : 'text-[#757575] dark:text-slate-400 group-hover:text-[#212121] dark:group-hover:text-slate-200'} >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#EEEEEE] dark:border-slate-800 space-y-2">
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#757575] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm active:scale-95 transition-all w-full"
        >
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#757575] dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm active:scale-95 w-full transition-all"
        >
          <LogOut size={22} />
          <span>Log Out</span>
        </button>
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
              <div className="absolute -top-3 w-[32px] h-[3px] bg-[#1CAE9E] rounded-b-[2px] shadow-[0_2px_8px_#1CAE9E80]"></div>
            )}
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
               <item.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#1CAE9E' : undefined}
                className={!isActive ? 'text-[#757575] dark:text-slate-500' : ''}
                />
            </div>
            <span 
              className={`text-[10px] font-medium mt-[4px] leading-none transition-colors ${isActive ? 'text-[#1CAE9E]' : 'text-[#757575] dark:text-slate-500'}`}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

const AppContent = ({ auth, stats, inventory, recipes, handleLogout, handleAddItem, handleUpdateStatus, handleDeleteItem, handleCookRecipe, handleUpdateRecipes, handleDonateComplete }: any) => {
  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 font-sans text-[#212121] dark:text-slate-100 flex transition-colors duration-300">
      {/* Desktop Sidebar */}
      <Sidebar handleLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[240px] h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-[90px] md:pb-0 scroll-smooth">
          <div className="w-full max-w-[1200px] mx-auto md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard user={auth.user} stats={stats} inventory={inventory} />} />
              <Route path="/inventory" element={
                 <Inventory 
                    items={inventory} 
                    onAddItem={handleAddItem} 
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteItem={handleDeleteItem}
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        
        {/* Mobile Nav */}
        <BottomNav />
      </div>
    </div>
  );
};

export default function App() {
  const [auth, setAuth] = useState<AuthState>(AuthService.init());
  const [isLoginView, setIsLoginView] = useState(true);
  const [inventory, setInventory] = useState<FoodItem[]>(INITIAL_INVENTORY);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

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

  // Theme Logic
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

  const handleLogin = (state: AuthState) => {
    setAuth(state);
  };

  const handleLogout = () => {
    AuthService.logout().then(setAuth);
  };

  // Handlers
  const handleAddItem = (item: FoodItem) => {
    setInventory(prev => [item, ...prev]);
  };

  const handleDeleteItem = (id: string) => {
      setInventory(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateStatus = (id: string, status: 'donated' | 'wasted' | 'consumed') => {
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
    // Mark items as consumed
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
    return isLoginView ? (
      <Login onLogin={handleLogin} onToggle={() => setIsLoginView(false)} />
    ) : (
      <Signup onLogin={handleLogin} onToggle={() => setIsLoginView(true)} />
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <HashRouter>
        <AppContent 
          auth={auth}
          stats={stats}
          inventory={inventory}
          recipes={generatedRecipes}
          handleLogout={handleLogout}
          handleAddItem={handleAddItem}
          handleDeleteItem={handleDeleteItem}
          handleUpdateStatus={handleUpdateStatus}
          handleCookRecipe={handleCookRecipe}
          handleUpdateRecipes={setGeneratedRecipes}
          handleDonateComplete={handleDonateComplete}
        />
      </HashRouter>
    </ThemeContext.Provider>
  );
}