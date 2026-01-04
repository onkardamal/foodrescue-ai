
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Home, Package, ChefHat, Heart, MapPin } from 'lucide-react';
import { FoodItem, UserStats, Recipe, FoodCategory, AuthState } from './types';
import { AuthService } from './services/auth';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Donation from './components/Donation';
import { Login, Signup } from './components/Auth';

// Initial Mock Data (Matches Spec Payload)
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

// Bottom Navigation Component
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
    <nav className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto h-[80px] bg-white border-t border-[rgba(33,33,33,0.04)] z-[100] flex justify-around items-start pt-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center w-[60px] relative group"
          >
            {isActive && (
              <div className="absolute -top-3 w-[32px] h-[3px] bg-[#1CAE9E] rounded-b-[2px] shadow-[0_2px_8px_#1CAE9E80]"></div>
            )}
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
               <item.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#1CAE9E' : '#757575'} 
                />
            </div>
            <span 
              className={`text-[10px] font-medium mt-[4px] leading-none transition-colors ${isActive ? 'text-[#1CAE9E]' : 'text-[#757575]'}`}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

const AppContent = ({ auth, stats, inventory, handleLogout, handleAddItem, handleUpdateStatus, handleDeleteItem, handleCookRecipe, handleDonateComplete }: any) => {
  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#212121] flex justify-center">
      <div className="w-full max-w-[420px] bg-[#F5F5F5] min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-[90px] scroll-smooth">
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
              <div className="p-[20px]">
                <Recipes 
                  inventory={inventory} 
                  onCookRecipe={handleCookRecipe} 
                />
              </div>
            } />
            <Route path="/donate" element={
               <div className="p-[20px]">
                <Donation 
                    inventory={inventory} 
                    onDonateComplete={handleDonateComplete} 
                />
               </div>
            } />
             <Route path="/ngos" element={
               <div className="p-[20px] flex flex-col items-center justify-center h-[70vh] text-[#757575]">
                  <MapPin size={48} className="text-[#1CAE9E] mb-4 opacity-50" />
                  <h3 className="font-bold text-lg">NGO Map</h3>
                  <p className="text-sm">Coming in v2.0</p>
               </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

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
    setInventory(prev => [item, ...prev]);
  };

  const handleDeleteItem = (id: string) => {
      setInventory(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateStatus = (id: string, status: 'donated' | 'wasted' | 'consumed') => {
    // If it's wasted, maybe remove it or mark it? Spec implies status update.
    // For this demo, if 'consumed' or 'wasted' via menu, we might just remove or update status.
    // Let's keep it in the list but change status, or filter out in views.
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
    return (
      <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#212121] flex justify-center">
        <div className="w-full max-w-[420px] bg-white min-h-screen relative shadow-2xl p-6 flex flex-col items-center justify-center">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#1CAE9E] rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">F</div>
                <h1 className="font-bold text-2xl tracking-tight text-[#212121]">FoodSaver</h1>
            </div>
          {isLoginView ? (
            <Login onLogin={handleLogin} onToggle={() => setIsLoginView(false)} />
          ) : (
            <Signup onLogin={handleLogin} onToggle={() => setIsLoginView(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <AppContent 
        auth={auth}
        stats={stats}
        inventory={inventory}
        handleLogout={handleLogout}
        handleAddItem={handleAddItem}
        handleDeleteItem={handleDeleteItem}
        handleUpdateStatus={handleUpdateStatus}
        handleCookRecipe={handleCookRecipe}
        handleDonateComplete={handleDonateComplete}
      />
    </HashRouter>
  );
}
