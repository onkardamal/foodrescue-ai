import React, { useState, useRef, useMemo } from 'react';
import { FoodItem, FoodCategory } from '../types';
import { analyzeFoodImage } from '../services/geminiService';
import { Camera, Plus, Trash2, Gift, Clock, Loader2, AlertTriangle, Search, Filter, X, ScanEye } from 'lucide-react';

interface InventoryProps {
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
  onUpdateStatus: (id: string, status: 'donated' | 'wasted') => void;
}

const Inventory: React.FC<InventoryProps> = ({ items, onAddItem, onUpdateStatus }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [newItem, setNewItem] = useState<Partial<FoodItem>>({
    name: '',
    category: FoodCategory.OTHER,
    quantity: 1,
    unit: 'pc',
    expiryDate: '',
    condition: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setIsAdding(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await analyzeFoodImage(base64);
        
        setNewItem({
          name: analysis.name,
          category: analysis.category as FoodCategory,
          quantity: analysis.quantityEstimation,
          unit: analysis.unitEstimation,
          expiryDate: analysis.expiryEstimation,
          condition: analysis.condition,
          imageUrl: reader.result as string
        });
      } catch (err) {
        alert("Could not identify food. Please enter details manually.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.expiryDate) return;

    onAddItem({
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      category: newItem.category as FoodCategory,
      quantity: newItem.quantity || 1,
      unit: newItem.unit || 'pc',
      expiryDate: newItem.expiryDate,
      imageUrl: newItem.imageUrl,
      status: 'active',
      condition: newItem.condition
    });

    setIsAdding(false);
    setNewItem({ name: '', category: FoodCategory.OTHER, quantity: 1, expiryDate: '', condition: '' });
  };

  const getDaysUntilExpiry = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  // Filter and Search Logic
  const filteredItems = useMemo(() => {
    return items
      .filter(i => i.status === 'active')
      .filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || i.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [items, searchTerm, filterCategory]);

  return (
    <div className="pb-28">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-3xl font-bold text-slate-800">My Pantry</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center gap-2 active:scale-95 transform"
          >
            <Camera size={20} />
            <span className="hidden md:inline font-medium">Scan</span>
          </button>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors active:scale-95 transform"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search food..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    <X size={16} />
                </button>
            )}
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
                onClick={() => setFilterCategory('All')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === 'All' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
                All
            </button>
            {Object.values(FoodCategory).map(cat => (
                <button 
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Item List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="bg-slate-50 p-4 rounded-full mb-3">
                <Search size={32} className="opacity-50" />
            </div>
            <p className="font-medium">No items found.</p>
            <p className="text-sm opacity-70">Try adjusting filters or scan new items.</p>
          </div>
        ) : filteredItems.map(item => {
          const daysLeft = getDaysUntilExpiry(item.expiryDate);
          const isUrgent = daysLeft <= 2;
          const isExpired = daysLeft < 0;
          
          return (
            <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow`}>
              {/* Status Indicator Line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isExpired ? 'bg-slate-400' : isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

              <div className="flex justify-between items-start mb-3 pl-3">
                <div className="flex gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-slate-50 shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-500 font-bold text-xl shadow-sm border border-slate-100">
                      {item.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{item.quantity} {item.unit} • <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">{item.category}</span></p>
                    {item.condition && (
                      <p className="text-xs text-slate-400 mt-1 italic">Cond: {item.condition}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pl-3 mt-1 flex items-center justify-between text-sm mb-4 bg-slate-50 p-2 rounded-lg">
                <div className="flex items-center gap-1.5">
                    <Clock size={15} className={isExpired ? 'text-slate-500' : isUrgent ? 'text-red-500' : 'text-slate-400'} />
                    <span className={`font-semibold ${isExpired ? 'text-slate-500' : isUrgent ? 'text-red-600' : 'text-slate-600'}`}>
                    {isExpired ? 'Expired' : isUrgent ? 'Expiring Soon' : `${daysLeft} days left`}
                    </span>
                </div>
                {isUrgent && !isExpired && <AlertTriangle size={16} className="text-red-500 animate-pulse" />}
              </div>

              <div className="pl-3 mt-auto flex gap-2">
                <button 
                  onClick={() => onUpdateStatus(item.id, 'donated')}
                  className="flex-1 bg-amber-50 text-amber-700 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Gift size={16} strokeWidth={2.5} /> Donate
                </button>
                <button 
                  onClick={() => onUpdateStatus(item.id, 'wasted')}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={16} strokeWidth={2.5} /> Waste
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 relative animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden"></div>
            
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Add Food Item</h3>
            
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <SparklesIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
                </div>
                <p className="text-slate-600 font-medium mt-6 animate-pulse text-center">AI is analyzing food condition...<br/><span className="text-sm font-normal opacity-70">Estimating freshness & expiry</span></p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {newItem.condition && (
                   <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-3">
                      <ScanEye className="text-indigo-600 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide">AI Condition Analysis</p>
                        <p className="text-sm text-indigo-700">{newItem.condition}</p>
                        <p className="text-xs text-indigo-500 mt-1">Expiry date auto-set based on this condition.</p>
                      </div>
                   </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Name</label>
                  <input 
                    type="text" 
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Organic Bananas"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Unit</label>
                    <select 
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="pc">Pieces</option>
                      <option value="kg">Kg</option>
                      <option value="g">Grams</option>
                      <option value="liter">Liter</option>
                      <option value="box">Box</option>
                      <option value="can">Can</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
                  <select 
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value as FoodCategory})}
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                  >
                    {Object.values(FoodCategory).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Expiry Date</label>
                  <input 
                    type="date" 
                    required
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 mt-8 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-colors"
                  >
                    Add to Pantry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for loading icon
const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 5H5"/><path d="M5 19v-4"/><path d="M9 19H5"/><path d="M19 19v-4"/><path d="M15 19h4"/><path d="M19 5v4"/><path d="M15 5h4"/></svg>
)

export default Inventory;