import React, { useState, useRef, useMemo, useEffect } from 'react';
import { FoodItem, FoodCategory } from '../types';
import { analyzeFoodImage } from '../services/geminiService';
import { Menu, Leaf, Plus, Search, Filter, LayoutGrid, List, MoreVertical, ChevronLeft, ChevronRight, ScanEye, AlertTriangle, Loader2, Trash2, Utensils, Pencil, Camera, X, CheckSquare, Sparkles, Check } from 'lucide-react';
import { useTheme } from '../App';
import { useNavigate } from 'react-router-dom';

interface InventoryProps {
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
  onUpdateStatus: (id: string, status: 'donated' | 'wasted' | 'consumed') => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: FoodItem) => void;
}

// Visual mapping helper for the specific items in the spec
const getVisualDetails = (item: FoodItem) => {
  const nameLower = item.name.toLowerCase();
  
  // Emojis mapping based on spec
  let emoji = "📦";
  if (nameLower.includes("beef") || nameLower.includes("meat")) emoji = "🥩";
  else if (nameLower.includes("tomato") || nameLower.includes("lettuce") || nameLower.includes("vegetable")) emoji = "🥬";
  else if (nameLower.includes("bun") || nameLower.includes("bread")) emoji = "🍞";
  else if (nameLower.includes("cheese")) emoji = "🧀"; 
  else if (nameLower.includes("milk") || nameLower.includes("yogurt")) emoji = "🥛";
  else if (nameLower.includes("apple")) emoji = "🍎";
  else if (nameLower.includes("banana")) emoji = "🍌";
  else if (nameLower.includes("chicken")) emoji = "🍗";
  else if (nameLower.includes("egg")) emoji = "🥚";

  // Status calculation logic
  const now = new Date();
  const expiry = new Date(item.expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusText = `${diffDays} days`;
  let statusColor = "#00796B"; // Teal (Normal)
  let freshnessPercent = 100;
  
  // Calculate freshness (100 = Fresh, 0 = Expired)
  if (diffDays < 0) {
    statusText = "Expired";
    statusColor = "#D32F2F"; // Red
    freshnessPercent = 0;
  } else if (diffDays <= 2) {
    statusText = `Expires soon`;
    statusColor = "#D32F2F"; // Red
    freshnessPercent = 10 + (diffDays * 5); // 10% to 20%
  } else if (diffDays <= 4) {
    statusText = `${diffDays} days left`;
    statusColor = "#C2410C"; // Dark Orange
    freshnessPercent = 30 + (diffDays * 5); // 45% approx
  } else if (diffDays > 30) {
     const dateStr = expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
     statusText = dateStr;
     freshnessPercent = 100;
  } else {
     statusText = `${diffDays} days`;
     freshnessPercent = Math.min(100, 30 + (diffDays * 3));
  }

  // Visual Overrides for demo consistency
  if (item.condition === "Expired") { statusText = "Expired"; statusColor = "#D32F2F"; freshnessPercent=0; }
  if (item.condition === "Expiring Soon") { statusColor = "#C2410C"; freshnessPercent=25; }

  // Clamp
  freshnessPercent = Math.max(0, Math.min(100, freshnessPercent));

  return { emoji, statusText, statusColor, freshnessPercent };
};

// Circular Progress Component
const CircularItem = ({ emoji, percent, color }: { emoji: string, percent: number, color: string }) => {
    const radius = 26;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
  
    return (
      <div className="relative w-[60px] h-[60px] flex items-center justify-center mr-[16px] shrink-0" role="img" aria-label={`Freshness: ${Math.round(percent)}%`}>
         {/* Background Circle */}
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
           <circle
              stroke="#E0E0E0" // Light gray track
              strokeWidth={stroke}
              fill="transparent"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="dark:stroke-slate-700"
           />
           <circle
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              strokeLinecap="round"
              fill="transparent"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
           />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[28px]">
            {emoji}
        </div>
        
        {/* Percentage Badge */}
        <div 
            className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white border border-white dark:border-slate-800 shadow-sm"
            style={{ backgroundColor: color }}
        >
            {Math.round(percent)}%
        </div>
      </div>
    );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onInteract: () => void;
  disabled: boolean;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onEdit, onDelete, onInteract, disabled }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const isScrolling = useRef(false);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    onInteract();
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startOffset.current = offset;
    isDragging.current = true;
    isScrolling.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isScrolling.current || disabled) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Detect scrolling intent (vertical move > horizontal move)
    if (Math.abs(diffY) > Math.abs(diffX) || Math.abs(diffY) > 10) {
        isScrolling.current = true;
        return;
    }

    // Drag left (negative) up to -120px, drag right up to 0
    const newOffset = Math.min(0, Math.max(-120, startOffset.current + diffX));
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    isDragging.current = false;
    isScrolling.current = false;
    
    // Threshold snap logic: Must pull at least 50px to snap open
    if (offset < -50) {
      setOffset(-120);
    } else {
      setOffset(0);
    }
  };

  // Mouse Handlers for Desktop Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    onInteract();
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offset;
    isDragging.current = true;
    isScrolling.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || isScrolling.current || disabled) return;
    
    // Check if mouse button is still down (in case mouseup happened outside)
    if (e.buttons !== 1) {
        handleMouseUp();
        return;
    }

    const currentX = e.clientX;
    const diffX = currentX - startX.current;
    
    // Drag left (negative) up to -120px, drag right up to 0
    const newOffset = Math.min(0, Math.max(-120, startOffset.current + diffX));
    setOffset(newOffset);
  };

  const handleMouseUp = () => {
    if (disabled) return;
    isDragging.current = false;
    isScrolling.current = false;
    
    if (offset < -50) {
      setOffset(-120);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative w-full h-[88px] overflow-hidden rounded-[12px]">
      {/* Background Actions */}
      <div className="absolute inset-y-0 right-0 w-[120px] flex rounded-r-[12px]">
        <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); setOffset(0); }}
            className="flex-1 bg-blue-600 text-white flex flex-col items-center justify-center active:bg-blue-700 transition-colors"
            aria-label="Edit Item"
        >
            <Pencil size={18} />
            <span className="text-[10px] font-bold mt-1">Edit</span>
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); setOffset(0); }}
            className="flex-1 bg-[#D32F2F] text-white flex flex-col items-center justify-center active:bg-red-700 transition-colors"
            aria-label="Delete Item"
        >
            <Trash2 size={18} />
            <span className="text-[10px] font-bold mt-1">Delete</span>
        </button>
      </div>
      
      {/* Foreground Card */}
      <div 
        className="relative w-full h-full bg-white dark:bg-slate-800 rounded-[12px] shadow-sm border border-slate-200 dark:border-slate-700 z-10 transition-transform duration-200 ease-out touch-pan-y hover:shadow-md"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>
    </div>
  );
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

const Inventory: React.FC<InventoryProps> = ({ items, onAddItem, onUpdateStatus, onDeleteItem, onEditItem }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<'expiry' | 'name'>('expiry');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Add Item Logic
  const [isAdding, setIsAdding] = useState(false); // Used for scanning loading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add / Edit Logic
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const manualNameRef = useRef<HTMLInputElement>(null);
  const [manualForm, setManualForm] = useState({
    name: '',
    category: 'Produce',
    quantity: '1',
    unit: 'pcs',
    expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

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
      if (item.status !== 'active') return false;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
        if (sortMode === 'expiry') {
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        } else {
            return a.name.localeCompare(b.name);
        }
    });
  }, [items, searchTerm, activeCategory, sortMode]);

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedItemIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedItemIds(newSet);
  };

  const startEdit = (item: FoodItem) => {
      setEditingItem(item);
      setManualForm({
          name: item.name,
          category: item.category,
          quantity: item.quantity.toString(),
          unit: item.unit,
          expiryDate: item.expiryDate.split('T')[0]
      });
      setShowManualAdd(true);
      setTimeout(() => manualNameRef.current?.focus(), 100);
  };

  const startAdd = () => {
      setEditingItem(null);
      setManualForm({
          name: '',
          category: 'Produce',
          quantity: '1',
          unit: 'pcs',
          expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      });
      setShowManualAdd(true);
      setTimeout(() => manualNameRef.current?.focus(), 100);
  };

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

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const itemData = {
            name: manualForm.name,
            category: manualForm.category as FoodCategory,
            quantity: parseFloat(manualForm.quantity) || 1,
            unit: manualForm.unit,
            expiryDate: new Date(manualForm.expiryDate).toISOString(),
            status: 'active' as const,
            condition: editingItem ? editingItem.condition : 'Good'
        };

        if (editingItem) {
            onEditItem({ ...editingItem, ...itemData });
        } else {
             onAddItem({
                id: Math.random().toString(36).substr(2, 9),
                ...itemData
            });
        }

        setShowManualAdd(false);
    };

    const handleCookSelected = () => {
        const selectedItems = items.filter(i => selectedItemIds.has(i.id));
        const ingredientNames = selectedItems.map(i => i.name).join(', ');
        navigate('/recipes', { state: { ingredients: ingredientNames } });
    };

  return (
    <div className="bg-[#FFFFFF] dark:bg-slate-950 min-h-screen pb-24 md:pb-0 animate-in fade-in duration-300 transition-colors" onClick={() => setShowSortMenu(false)}>
      
      {/* 2) Header Area (Unified) */}
      <header className="pt-[12px] px-[16px] pb-[4px] md:px-0 flex flex-col gap-[8px]">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-[4px]">
                <button 
                    onClick={() => navigate(-1)}
                    className="w-[44px] h-[44px] flex items-center justify-center -ml-[12px] rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                    aria-label="Back"
                >
                    <ChevronLeft size={28} className="text-[#212121] dark:text-white" />
                </button>
                <h1 className="text-[24px] md:text-[32px] font-[700] text-[#212121] dark:text-white leading-tight">
                    {isSelectionMode ? "Select Ingredients" : "Food Inventory"}
                </h1>
            </div>

            {/* Actions */}
            {isSelectionMode ? (
                 <button 
                    onClick={() => { setIsSelectionMode(false); setSelectedItemIds(new Set()); }}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-[16px] h-[40px] rounded-[12px] font-semibold text-sm"
                 >
                     Cancel
                 </button>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#00796B] text-white flex items-center justify-center w-[40px] md:w-auto md:px-[16px] h-[40px] rounded-[12px] active:scale-95 transition-transform shadow-sm hover:bg-[#00695C]"
                        aria-label="Scan food item"
                    >
                        <Camera size={20} strokeWidth={2.5} />
                        <span className="text-[14px] font-[600] hidden md:inline ml-2">Scan</span>
                    </button>
                    <button 
                        onClick={startAdd}
                        className="bg-white dark:bg-slate-800 border border-[#E0E0E0] dark:border-slate-700 text-[#212121] dark:text-white flex items-center justify-center w-[40px] md:w-auto md:px-[16px] h-[40px] rounded-[12px] active:scale-95 transition-transform shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                        aria-label="Manually add food item"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        <span className="text-[14px] font-[600] hidden md:inline ml-2">Add</span>
                    </button>
                </div>
            )}
        </div>
        
        <p className="text-[14px] md:text-[16px] font-[400] text-[#757575] dark:text-slate-400 pl-[4px] -mt-2">
             {isSelectionMode ? `${selectedItemIds.size} items selected` : `${items.filter(i => i.status === 'active').length} items tracked`}
        </p>

        <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
        />
      </header>

      {/* 4) Search & Controls Row */}
      <div className="px-[16px] md:px-0 mt-[16px] flex gap-[12px] relative z-20">
        {/* Search Bar */}
        <div className="flex-1 relative h-[44px]">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#757575] dark:text-slate-500" size={20} />
            <input 
                type="text" 
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full bg-[#F5F5F5] dark:bg-slate-800 rounded-[12px] pl-[40px] pr-[12px] text-[14px] outline-none focus:ring-2 focus:ring-[#00796B]/20 transition-all placeholder-[#757575] dark:placeholder-slate-500 text-[#212121] dark:text-white"
                aria-label="Search food items"
            />
        </div>

        {/* Controls Column */}
        <div className="flex flex-col gap-[8px] items-end relative">
            <div className="flex gap-2">
                 <button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`h-[36px] w-[36px] md:w-auto md:px-3 rounded-[8px] flex items-center justify-center gap-2 border shadow-sm transition-all ${isSelectionMode ? 'bg-[#00796B] border-[#00796B] text-white' : 'bg-white dark:bg-slate-800 border-[#EEEEEE] dark:border-slate-700 text-[#212121] dark:text-slate-200'}`}
                    title="Select Ingredients"
                    aria-label={isSelectionMode ? "Exit Selection Mode" : "Enter Selection Mode"}
                 >
                     <CheckSquare size={16} />
                     <span className="hidden md:inline text-xs font-medium">Select</span>
                 </button>

                <button 
                    onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }}
                    className="h-[36px] w-[90px] bg-white dark:bg-slate-800 border border-[#EEEEEE] dark:border-slate-700 rounded-[8px] flex items-center justify-center gap-2 text-[#212121] dark:text-slate-200 text-[12px] font-[500] shadow-sm active:bg-gray-50 dark:active:bg-slate-700"
                    aria-expanded={showSortMenu}
                    aria-haspopup="true"
                    aria-label="Sort items"
                >
                    <Filter size={14} /> {sortMode === 'expiry' ? 'Expiry' : 'Name'}
                </button>
            </div>
            
            {/* Sort Dropdown */}
            {showSortMenu && (
                <div className="absolute top-[40px] right-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl p-1 w-[120px] animate-in fade-in zoom-in-95 duration-200 z-30" role="menu">
                    <button onClick={() => setSortMode('expiry')} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${sortMode === 'expiry' ? 'bg-[#00796B]/10 text-[#00796B]' : 'text-[#757575] dark:text-slate-400'}`} role="menuitem">Expiry Date</button>
                    <button onClick={() => setSortMode('name')} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${sortMode === 'name' ? 'bg-[#00796B]/10 text-[#00796B]' : 'text-[#757575] dark:text-slate-400'}`} role="menuitem">Name (A-Z)</button>
                </div>
            )}
        </div>
      </div>

      {/* 5) Category Filter Tabs */}
      <div className="relative mt-[16px] h-[40px] flex items-center">
        <button onClick={() => scrollTabs('left')} className="absolute left-0 h-full pl-2 bg-gradient-to-r from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent z-10 flex items-center" aria-label="Scroll Categories Left">
            <ChevronLeft size={16} className="text-[#757575] dark:text-slate-400" />
        </button>
        
        <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-[8px] px-[16px] md:px-0 scrollbar-hide w-full"
            style={{ scrollSnapType: 'x mandatory' }}
        >
            {CATEGORIES.map(cat => {
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
                            ${isActive 
                                ? 'bg-[#00796B] text-white shadow-md shadow-teal-100 dark:shadow-teal-900/20' 
                                : 'bg-[#F5F5F5] dark:bg-slate-800 text-[#757575] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}
                        `}
                    >
                        {cat} ({count})
                    </button>
                );
            })}
        </div>

        <button onClick={() => scrollTabs('right')} className="absolute right-0 h-full pr-2 bg-gradient-to-l from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent z-10 flex items-center" aria-label="Scroll Categories Right">
            <ChevronRight size={16} className="text-[#757575] dark:text-slate-400" />
        </button>
      </div>

      {/* 6) Food Items List (Responsive Grid with Swipe) */}
      <div className="px-[16px] md:px-0 mt-[20px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        {filteredItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-50 text-[#757575] dark:text-slate-400">
                <Search size={48} className="mb-4" />
                <p>No food items found.</p>
            </div>
        ) : filteredItems.map(item => {
            const visual = getVisualDetails(item);
            const isSelected = selectedItemIds.has(item.id);

            return (
                <div key={item.id} className="relative group">
                    <SwipeableCard 
                        onEdit={() => startEdit(item)}
                        onDelete={() => onDeleteItem(item.id)}
                        onInteract={() => {}}
                        disabled={isSelectionMode} // Disable Swipe in selection mode
                    >
                        <div 
                            className={`w-full h-full flex items-center px-[16px] cursor-pointer ${isSelectionMode && isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}
                            onClick={() => {
                                if (isSelectionMode) toggleSelection(item.id);
                            }}
                            role={isSelectionMode ? "checkbox" : "listitem"}
                            aria-checked={isSelectionMode ? isSelected : undefined}
                            tabIndex={isSelectionMode ? 0 : -1}
                            onKeyDown={(e) => {
                                if (isSelectionMode && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    toggleSelection(item.id);
                                }
                            }}
                        >
                            {/* Selection Checkbox (Visible in Mode) */}
                            {isSelectionMode && (
                                <div className={`mr-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#00796B] bg-[#00796B]' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {isSelected && <CheckSquare size={14} className="text-white" />}
                                </div>
                            )}

                            {/* Left: Circular Progress with Emoji */}
                            <CircularItem 
                                emoji={visual.emoji} 
                                percent={visual.freshnessPercent} 
                                color={visual.statusColor} 
                            />

                            {/* Center Column */}
                            <div className="flex-1 flex flex-col justify-center gap-[4px] min-w-0 pr-4">
                                <div className="flex items-baseline gap-[8px]">
                                    <span className="text-[16px] font-[700] text-[#212121] dark:text-slate-100 truncate">{item.name}</span>
                                    <span className="text-[14px] font-[400] text-[#757575] dark:text-slate-400 shrink-0">{item.quantity} {item.unit}</span>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <span className="bg-[#F5F5F5] dark:bg-slate-700 text-[#757575] dark:text-slate-300 text-[10px] px-[6px] py-[2px] rounded-[4px] uppercase font-bold tracking-wide shrink-0">
                                        {item.category}
                                    </span>
                                    <span 
                                        className="text-[12px] font-[600] truncate"
                                        style={{ color: visual.statusColor }}
                                    >
                                        {visual.statusText}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Direct Eat Button (No more Three Dots) */}
                            {!isSelectionMode && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(item.id, 'consumed'); }}
                                    className="h-[40px] px-3 bg-[#00796B]/10 text-[#00796B] hover:bg-[#00796B] hover:text-white rounded-[10px] flex items-center gap-2 font-semibold text-xs active:scale-95 transition-all group-hover:shadow-sm border border-transparent hover:border-[#00796B]"
                                    aria-label="Mark as Eaten"
                                >
                                    <Utensils size={16} strokeWidth={2.5} />
                                    <span>Eat</span>
                                </button>
                            )}
                        </div>
                    </SwipeableCard>
                </div>
            );
        })}
      </div>
      
      {/* Floating Action Button for Recipe Generation */}
      {isSelectionMode && selectedItemIds.size > 0 && (
          <div className="fixed bottom-24 md:bottom-8 right-6 z-40 animate-in zoom-in slide-in-from-bottom-4">
              <button 
                onClick={handleCookSelected}
                className="bg-[#00796B] text-white px-6 py-4 rounded-2xl shadow-xl shadow-teal-500/30 flex items-center gap-3 font-bold text-lg hover:scale-105 active:scale-95 transition-all"
              >
                  <Sparkles fill="white" size={24} />
                  <span>Cook {selectedItemIds.size} Items</span>
              </button>
          </div>
      )}

       {/* Scan Loading Modal */}
       {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-in fade-in duration-200" role="alertdialog" aria-modal="true" aria-labelledby="scan-title">
             <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
                 {isAnalyzing ? (
                     <div className="py-8">
                         <Loader2 className="animate-spin mx-auto text-[#00796B] mb-4" size={48} />
                         <p id="scan-title" className="text-[#212121] dark:text-white font-bold text-lg">Analyzing Food...</p>
                         <p className="text-[#757575] dark:text-slate-400">Identifying items & expiration</p>
                     </div>
                 ) : (
                    <div className="text-left">
                        {scanError ? (
                            <div className="text-center py-6">
                                <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
                                <p id="scan-title" className="text-[#212121] dark:text-white font-bold mb-1">Scan Failed</p>
                                <p className="text-[#757575] dark:text-slate-400 text-sm mb-4">{scanError}</p>
                                <button onClick={() => setIsAdding(false)} className="w-full py-3 bg-[#F5F5F5] dark:bg-slate-800 rounded-xl font-bold text-[#757575] dark:text-slate-300">Close</button>
                            </div>
                        ) : null}
                    </div>
                 )}
             </div>
        </div>
       )}

       {/* Manual Add / Edit Modal */}
       {showManualAdd && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 relative">
                <button 
                    onClick={() => setShowManualAdd(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close Modal"
                >
                    <X size={20} className="text-slate-400" />
                </button>
                
                <h3 id="modal-title" className="text-xl font-bold text-[#212121] dark:text-white mb-6">
                    {editingItem ? 'Edit Item' : 'Add Item Manually'}
                </h3>
                
                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="itemName" className="block text-sm font-bold text-[#757575] dark:text-slate-400 mb-1">Item Name</label>
                        <input 
                            id="itemName"
                            ref={manualNameRef}
                            type="text" 
                            value={manualForm.name}
                            onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                            className="w-full bg-[#F5F5F5] dark:bg-slate-800 border-transparent rounded-xl px-4 py-3 text-[#212121] dark:text-white focus:ring-2 focus:ring-[#00796B] outline-none font-medium"
                            placeholder="e.g. Bananas"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="category" className="block text-sm font-bold text-[#757575] dark:text-slate-400 mb-1">Category</label>
                            <select 
                                id="category"
                                value={manualForm.category}
                                onChange={(e) => setManualForm({...manualForm, category: e.target.value})}
                                className="w-full bg-[#F5F5F5] dark:bg-slate-800 border-transparent rounded-xl px-4 py-3 text-[#212121] dark:text-white focus:ring-2 focus:ring-[#00796B] outline-none font-medium appearance-none"
                            >
                                {CATEGORIES.filter(c => c !== "All").map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="expiryDate" className="block text-sm font-bold text-[#757575] dark:text-slate-400 mb-1">Expiry Date</label>
                            <input 
                                id="expiryDate"
                                type="date"
                                value={manualForm.expiryDate}
                                onChange={(e) => setManualForm({...manualForm, expiryDate: e.target.value})}
                                className="w-full bg-[#F5F5F5] dark:bg-slate-800 border-transparent rounded-xl px-4 py-3 text-[#212121] dark:text-white focus:ring-2 focus:ring-[#00796B] outline-none font-medium"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="quantity" className="block text-sm font-bold text-[#757575] dark:text-slate-400 mb-1">Quantity</label>
                            <input 
                                id="quantity"
                                type="number"
                                min="0.1"
                                step="any"
                                value={manualForm.quantity}
                                onChange={(e) => setManualForm({...manualForm, quantity: e.target.value})}
                                className="w-full bg-[#F5F5F5] dark:bg-slate-800 border-transparent rounded-xl px-4 py-3 text-[#212121] dark:text-white focus:ring-2 focus:ring-[#00796B] outline-none font-medium"
                                required
                            />
                        </div>
                         <div>
                            <label htmlFor="unit" className="block text-sm font-bold text-[#757575] dark:text-slate-400 mb-1">Unit</label>
                            <input 
                                id="unit"
                                type="text"
                                value={manualForm.unit}
                                onChange={(e) => setManualForm({...manualForm, unit: e.target.value})}
                                className="w-full bg-[#F5F5F5] dark:bg-slate-800 border-transparent rounded-xl px-4 py-3 text-[#212121] dark:text-white focus:ring-2 focus:ring-[#00796B] outline-none font-medium"
                                placeholder="pcs, kg..."
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-[#00796B] text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-200 dark:shadow-teal-900/40 hover:bg-[#00695C] transition-colors mt-4 active:scale-95"
                    >
                        {editingItem ? 'Save Changes' : 'Add Item'}
                    </button>
                </form>
            </div>
         </div>
       )}

    </div>
  );
};

export default Inventory;