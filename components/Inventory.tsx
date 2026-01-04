
import React, { useState, useRef, useMemo } from 'react';
import { FoodItem, FoodCategory } from '../types';
import { analyzeFoodImage } from '../services/geminiService';
import { Menu, Leaf, Plus, Search, Filter, LayoutGrid, List, MoreVertical, ChevronLeft, ChevronRight, ScanEye, AlertTriangle, Loader2, Trash2, Utensils } from 'lucide-react';

interface InventoryProps {
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
  onUpdateStatus: (id: string, status: 'donated' | 'wasted' | 'consumed') => void;
  onDeleteItem: (id: string) => void;
}

// Visual mapping helper for the specific items in the spec
const getVisualDetails = (item: FoodItem) => {
  const nameLower = item.name.toLowerCase();
  
  // Emojis mapping based on spec
  let emoji = "📦";
  if (nameLower.includes("beef")) emoji = "🥩";
  else if (nameLower.includes("tomato") || nameLower.includes("lettuce")) emoji = "🥬";
  else if (nameLower.includes("bun")) emoji = "🍞";
  else if (nameLower.includes("cheese")) emoji = "🧀"; 
  else if (nameLower.includes("milk") || nameLower.includes("yogurt")) emoji = "🥛";
  else if (nameLower.includes("apple")) emoji = "🍎";
  else if (nameLower.includes("banana")) emoji = "🍌";

  // Status calculation logic to match spec
  const now = new Date();
  const expiry = new Date(item.expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusText = `${diffDays} days`;
  let statusColor = "#1CAE9E"; // Teal (Normal)
  let progressPercent = 50;
  let progressColor = "#1CAE9E";

  if (diffDays < 0) {
    statusText = "Expired";
    statusColor = "#F44336"; // Red
    progressPercent = 100;
    progressColor = "#F44336";
  } else if (diffDays <= 4) {
    statusText = `Expires in ${diffDays} days`;
    statusColor = "#FFC107"; // Yellow
    progressPercent = 80;
    progressColor = "#FFC107";
  } else if (diffDays > 300) {
     // Specific check for long expiry items
     const dateStr = expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
     statusText = dateStr;
     progressPercent = 10;
  } else {
     statusText = `${diffDays} days`;
     progressPercent = Math.max(10, 100 - (diffDays * 5)); 
  }

  // Visual Overrides for demo consistency
  if (item.condition === "Expired") { statusText = "Expired"; statusColor = "#F44336"; progressPercent=100; progressColor="#F44336"; }
  if (item.condition === "Expiring Soon") { statusColor = "#FFC107"; progressColor="#FFC107"; }

  return { emoji, statusText, statusColor, progressPercent, progressColor };
};

const CATEGORIES = [
  "All",
  "Produce",
  "Dairy",
  "Meat",
  "Grains",
  "Bakery",
  "Canned",
  "Other"
];

const Inventory: React.FC<InventoryProps> = ({ items, onAddItem, onUpdateStatus, onDeleteItem }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<'expiry' | 'name'>('expiry');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Add Item Logic
  const [isAdding, setIsAdding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 100;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Basic Status Filter (hide consumed/donated from main list for demo clarity)
      if (item.status !== 'active') return false;

      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort Logic
    return filtered.sort((a, b) => {
        if (sortMode === 'expiry') {
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        } else {
            return a.name.localeCompare(b.name);
        }
    });
  }, [items, searchTerm, activeCategory, sortMode]);

  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;
  
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
  
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl.split(',')[1]);
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };
  
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      setIsAnalyzing(true);
      setIsAdding(true);
      setScanError(null);
  
      try {
          const base64 = await compressImage(file);
          const analysis = await analyzeFoodImage(base64);
          
          onAddItem({
            id: Math.random().toString(36).substr(2, 9),
            name: analysis.name,
            category: analysis.category as FoodCategory,
            quantity: analysis.quantityEstimation,
            unit: analysis.unitEstimation,
            expiryDate: analysis.expiryEstimation,
            status: 'active',
            condition: analysis.condition
          });
          setIsAdding(false);
          setIsAnalyzing(false);
      } catch (err: any) {
          console.error(err);
          if (err.message === "NOT_FOOD") {
              setScanError("No food detected. Please scan a valid food item.");
          } else {
              setScanError("Could not identify food. Please try again or enter details manually.");
          }
          setIsAnalyzing(false);
      } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-24 animate-in fade-in duration-300" onClick={() => { setActiveMenuId(null); setShowSortMenu(false); }}>
      
      {/* 2) Header Area */}
      <header className="flex justify-between items-center h-[64px] px-4 pt-[16px] bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
            {/* Logo placeholder - using Leaf icon */}
            <div className="w-[48px] h-[48px] flex items-center justify-start">
                <div className="w-[40px] h-[40px] bg-[#1CAE9E] rounded-full flex items-center justify-center shadow-md shadow-teal-100">
                    <Leaf size={20} color="white" fill="white" />
                </div>
            </div>
            <h1 className="text-[16px] font-[600] text-[#212121]">FoodSaver</h1>
        </div>
        <button className="w-[44px] h-[44px] flex items-center justify-end active:scale-90 transition-transform">
            <Menu size={24} color="#757575" />
        </button>
      </header>

      {/* 3) Page Title Section */}
      <div className="px-[16px] pt-[12px] flex justify-between items-start">
        <div>
            <h2 className="text-[28px] font-[700] text-[#212121] leading-[36px]">Food Inventory</h2>
            <p className="text-[14px] font-[400] text-[#757575] mt-[4px]">{items.filter(i => i.status === 'active').length} items tracked</p>
        </div>
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#1CAE9E] text-white flex items-center gap-2 px-[16px] h-[40px] rounded-[12px] active:scale-95 transition-transform shadow-sm hover:bg-[#179c8d]"
        >
            <Plus size={16} strokeWidth={3} />
            <span className="text-[14px] font-[500]">Add Food</span>
        </button>
        <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
        />
      </div>

      {/* 4) Search & Controls Row */}
      <div className="px-[16px] mt-[16px] flex gap-[12px] relative z-20">
        {/* Search Bar */}
        <div className="flex-1 relative h-[44px]">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#757575]" size={20} />
            <input 
                type="text" 
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full bg-[#F5F5F5] rounded-[12px] pl-[40px] pr-[12px] text-[14px] outline-none focus:ring-2 focus:ring-[#1CAE9E]/20 transition-all placeholder-[#757575]"
            />
        </div>

        {/* Controls Column */}
        <div className="flex flex-col gap-[8px] items-end relative">
            {/* Sort Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }}
                className="h-[36px] w-[90px] bg-white border border-[#EEEEEE] rounded-[8px] flex items-center justify-center gap-2 text-[#212121] text-[12px] font-[500] shadow-sm active:bg-gray-50"
            >
                <Filter size={14} /> {sortMode === 'expiry' ? 'Expiry' : 'Name'}
            </button>
            {/* Sort Dropdown */}
            {showSortMenu && (
                <div className="absolute top-[40px] right-0 bg-white border border-slate-100 shadow-xl rounded-xl p-1 w-[120px] animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => setSortMode('expiry')} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${sortMode === 'expiry' ? 'bg-[#1CAE9E]/10 text-[#1CAE9E]' : 'text-[#757575]'}`}>Expiry Date</button>
                    <button onClick={() => setSortMode('name')} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${sortMode === 'name' ? 'bg-[#1CAE9E]/10 text-[#1CAE9E]' : 'text-[#757575]'}`}>Name (A-Z)</button>
                </div>
            )}
            
            {/* View Toggle */}
            <div className="flex gap-[12px] pr-1">
                <LayoutGrid size={20} color="#757575" className="opacity-50" />
                <List size={20} color="#1CAE9E" />
            </div>
        </div>
      </div>

      {/* 5) Category Filter Tabs */}
      <div className="relative mt-[16px] h-[40px] flex items-center">
        <button onClick={() => scrollTabs('left')} className="absolute left-0 h-full pl-2 bg-gradient-to-r from-white via-white to-transparent z-10 flex items-center">
            <ChevronLeft size={16} color="#757575" />
        </button>
        
        <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-[8px] px-[16px] scrollbar-hide w-full"
            style={{ scrollSnapType: 'x mandatory' }}
        >
            {CATEGORIES.map(cat => {
                // Count items in category for (count)
                let count = 0;
                if (cat === "All") count = items.filter(i => i.status === 'active').length;
                else count = items.filter(i => i.category === cat && i.status === 'active').length;
                
                const isActive = activeCategory === cat;
                return (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`
                            whitespace-nowrap px-[16px] h-[36px] rounded-[20px] text-[12px] font-[600] transition-colors scroll-snap-align-start
                            ${isActive ? 'bg-[#1CAE9E] text-white shadow-md shadow-teal-100' : 'bg-[#F5F5F5] text-[#757575] hover:bg-slate-200'}
                        `}
                    >
                        {cat} ({count})
                    </button>
                );
            })}
        </div>

        <button onClick={() => scrollTabs('right')} className="absolute right-0 h-full pr-2 bg-gradient-to-l from-white via-white to-transparent z-10 flex items-center">
            <ChevronRight size={16} color="#757575" />
        </button>
      </div>

      {/* 6) Food Items List */}
      <div className="px-[16px] mt-[20px] flex flex-col gap-[8px]">
        {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <Search size={48} className="mb-4" />
                <p>No food items found.</p>
            </div>
        ) : filteredItems.map(item => {
            const visual = getVisualDetails(item);
            return (
                <div key={item.id} className="relative bg-white rounded-[12px] h-[88px] shadow-[0_2px_4px_rgba(0,0,0,0.08)] flex items-center px-[16px] hover:shadow-md transition-shadow">
                    
                    {/* Left: Emoji */}
                    <div className="w-[32px] h-[32px] text-[28px] flex items-center justify-center mr-[12px]">
                        {visual.emoji}
                    </div>

                    {/* Center Column */}
                    <div className="flex-1 flex flex-col justify-center gap-[4px]">
                        <div className="flex items-baseline gap-[8px]">
                            <span className="text-[16px] font-[700] text-[#212121] truncate max-w-[140px]">{item.name}</span>
                            <span className="text-[14px] font-[400] text-[#757575]">{item.quantity} {item.unit}</span>
                        </div>
                        <div className="flex items-center gap-[8px]">
                            <span className="bg-[#F5F5F5] text-[#757575] text-[10px] px-[6px] py-[2px] rounded-[4px] uppercase font-bold tracking-wide">
                                {item.category}
                            </span>
                            <span 
                                className="text-[12px] font-[500]"
                                style={{ color: visual.statusColor }}
                            >
                                {visual.statusText}
                            </span>
                        </div>
                    </div>

                    {/* Right: Menu */}
                    <div className="relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                            className="w-[44px] h-[44px] flex items-center justify-end -mr-[8px] active:scale-90 transition-transform"
                        >
                            <MoreVertical size={20} color="#757575" />
                        </button>
                        
                        {/* Context Menu Popup */}
                        {activeMenuId === item.id && (
                             <div className="absolute right-0 top-10 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-30 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(item.id, 'consumed'); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                    <Utensils size={14} /> Eat
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Progress Bar */}
                    <div className="absolute bottom-[6px] left-[16px] right-[16px] h-[4px] bg-[#F5F5F5] rounded-[2px] overflow-hidden">
                        <div 
                            className="h-full rounded-[2px] transition-all duration-500" 
                            style={{ 
                                width: `${visual.progressPercent}%`, 
                                backgroundColor: visual.progressColor 
                            }}
                        ></div>
                    </div>
                </div>
            );
        })}
      </div>

       {/* Add Item Modal (Minimal for functionality) */}
       {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-[24px] p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
                 {isAnalyzing ? (
                     <div className="py-8">
                         <Loader2 className="animate-spin mx-auto text-[#1CAE9E] mb-4" size={48} />
                         <p className="text-[#212121] font-bold text-lg">Analyzing Food...</p>
                         <p className="text-[#757575]">Identifying items & expiration</p>
                     </div>
                 ) : (
                    <div className="text-left">
                        {scanError ? (
                            <div className="text-center py-6">
                                <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
                                <p className="text-[#212121] font-bold mb-1">Scan Failed</p>
                                <p className="text-[#757575] text-sm mb-4">{scanError}</p>
                                <button onClick={() => setIsAdding(false)} className="w-full py-3 bg-[#F5F5F5] rounded-xl font-bold text-[#757575]">Close</button>
                            </div>
                        ) : null}
                    </div>
                 )}
             </div>
        </div>
       )}

    </div>
  );
};

export default Inventory;
