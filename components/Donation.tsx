import React, { useState } from 'react';
import { NGO, FoodCategory, FoodItem } from '../types';
import { MapPin, Heart, CheckCircle, ArrowRight, ShoppingBag, Truck, Package, MessageSquare, ShieldCheck, List, Map as MapIcon, AlertCircle } from 'lucide-react';

// Mock Data
const MOCK_NGOS: NGO[] = [
  { 
    id: '1', 
    name: 'Helping Hands Shelter', 
    distance: '1.2 km', 
    needs: [FoodCategory.PRODUCE, FoodCategory.CANNED], 
    rating: 4.9, 
    coordinates: { lat: 0, lng: 0 },
    urgency: "Need food for 20 kids tonight" 
  },
  { 
    id: '2', 
    name: 'City Orphanage', 
    distance: '2.5 km', 
    needs: [FoodCategory.BAKERY, FoodCategory.DAIRY], 
    rating: 4.7, 
    coordinates: { lat: 0, lng: 0 },
    urgency: "Urgent: Dinner supplies low"
  },
  { 
    id: '3', 
    name: 'Community Fridge', 
    distance: '0.3 km', 
    needs: [FoodCategory.OTHER], 
    rating: 4.5, 
    coordinates: { lat: 0, lng: 0 },
    urgency: "Accepting all donations"
  },
];

interface DonationProps {
  inventory: FoodItem[];
  onDonateComplete: (itemIds: string[], amount: number) => void;
}

const Donation: React.FC<DonationProps> = ({ inventory, onDonateComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedNGO, setSelectedNGO] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'dropoff' | 'pickup'>('dropoff');
  const [pickupNote, setPickupNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Filter active items for donation
  const donatableItems = inventory.filter(i => i.status === 'active');
  
  // Calculate Values
  const foodValue = selectedItems.length * 10; // Estimated value saved ($10 per item)

  const handleItemToggle = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsProcessing(false);
    setIsSuccess(true);
    onDonateComplete(selectedItems, foodValue);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500 pt-10">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="text-green-600 dark:text-green-400 w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-[#212121] dark:text-white mb-2">Donation Confirmed!</h2>
        <p className="text-[#757575] dark:text-slate-400 mb-8 max-w-xs mx-auto">
          {deliveryMethod === 'pickup' 
            ? 'A volunteer driver has been notified and will arrive shortly.' 
            : 'Thank you for dropping off the food. The NGO is expecting you.'}
        </p>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm mb-8 border border-slate-100 dark:border-slate-700 shadow-lg">
           <div className="flex justify-between mb-3 pb-3 border-b border-slate-50 dark:border-slate-700">
             <span className="text-[#757575] dark:text-slate-400 text-sm">Value Rescued</span>
             <span className="font-bold text-[#1CAE9E]">${foodValue}.00</span>
           </div>
           <div className="flex justify-between mb-3 pb-3 border-b border-slate-50 dark:border-slate-700">
             <span className="text-[#757575] dark:text-slate-400 text-sm">Items Donated</span>
             <span className="font-bold text-[#212121] dark:text-white">{selectedItems.length} items</span>
           </div>
           <div className="flex justify-between">
             <span className="text-[#757575] dark:text-slate-400 text-sm">Recipient</span>
             <span className="font-bold text-[#212121] dark:text-white text-right">{MOCK_NGOS.find(n => n.id === selectedNGO)?.name}</span>
           </div>
        </div>
        <button 
          onClick={() => { setIsSuccess(false); setStep(1); setSelectedItems([]); setSelectedNGO(null); setDeliveryMethod('dropoff'); setPickupNote(''); }}
          className="bg-[#1CAE9E] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-200 dark:shadow-teal-900/40 hover:bg-[#179c8d] transition-colors"
        >
          Make Another Donation
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0 px-4 pt-4 animate-in fade-in duration-300 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-[28px] md:text-[36px] font-[700] text-[#212121] dark:text-white leading-[36px]">Donate Food</h2>
                <p className="text-[14px] font-[400] text-[#757575] dark:text-slate-400 mt-1">Step {step} of 3</p>
            </div>
            <div className="w-[40px] h-[40px] bg-[#F44336]/10 rounded-full flex items-center justify-center text-[#F44336]">
                <Heart size={20} fill="currentColor" />
            </div>
       </div>

      {/* Progress Bar */}
      <div className="h-1 bg-[#EEE] dark:bg-slate-700 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-[#1CAE9E] transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>

      {/* STEP 1: SELECT ITEMS */}
      {step === 1 && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <p className="text-[#757575] dark:text-slate-400 text-sm font-medium">Select items from your inventory:</p>
          
          <div className="grid gap-3">
            {donatableItems.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-[#E0E0E0] dark:border-slate-700">
                <ShoppingBag className="mx-auto text-[#CCC] dark:text-slate-600 mb-3" size={48} />
                <p className="text-[#757575] dark:text-slate-400">No active items to donate.</p>
              </div>
            ) : donatableItems.map(item => (
              <label key={item.id} className={`flex items-center p-4 bg-white dark:bg-slate-800 rounded-[16px] border transition-all cursor-pointer ${selectedItems.includes(item.id) ? 'border-[#1CAE9E] shadow-md bg-[#1CAE9E]/5 dark:bg-[#1CAE9E]/10' : 'border-transparent shadow-[0_2px_4px_rgba(0,0,0,0.05)]'}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-4 transition-colors ${selectedItems.includes(item.id) ? 'bg-[#1CAE9E] border-[#1CAE9E]' : 'border-[#CCC] dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                    {selectedItems.includes(item.id) && <CheckCircle size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleItemToggle(item.id)}
                  className="hidden"
                />
                <div className="flex-1">
                  <div className="font-bold text-[#212121] dark:text-white">{item.name}</div>
                  <div className="text-sm text-[#757575] dark:text-slate-400">{item.quantity} {item.unit}</div>
                </div>
                <div className="text-[#1CAE9E] font-bold bg-[#1CAE9E]/10 dark:bg-[#1CAE9E]/20 px-2 py-1 rounded text-[10px] uppercase tracking-wide">
                  {item.category}
                </div>
              </label>
            ))}
          </div>

          <div className="fixed bottom-24 md:bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[600px] md:relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-[16px] border border-slate-100 dark:border-slate-800 shadow-2xl md:shadow-none md:border-none flex items-center justify-between z-40">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#757575] dark:text-slate-400">Value</p>
              <p className="font-bold text-[#212121] dark:text-white text-xl">~${selectedItems.length * 10}</p>
            </div>
            <button 
              onClick={() => setStep(2)}
              disabled={selectedItems.length === 0}
              className="bg-[#1CAE9E] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-200 dark:shadow-teal-900/40 hover:bg-[#179c8d] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT NGO */}
      {step === 2 && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center">
            <p className="text-[#757575] dark:text-slate-400 text-sm font-medium">Choose a partner nearby:</p>
            {/* View Toggle */}
            <div className="flex bg-[#F5F5F5] dark:bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#1CAE9E]' : 'text-[#757575] dark:text-slate-400'}`}
                >
                    <List size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('map')} 
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#1CAE9E]' : 'text-[#757575] dark:text-slate-400'}`}
                >
                    <MapIcon size={16} />
                </button>
            </div>
          </div>
          
          {viewMode === 'map' ? (
            <div className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-[20px] relative overflow-hidden mb-4 border border-slate-200 dark:border-slate-700 shadow-inner">
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1CAE9E 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 
                 {/* Current Location Pin */}
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex flex-col items-center">
                       <div className="w-24 h-24 bg-[#1CAE9E]/20 rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                       <div className="w-4 h-4 bg-[#1CAE9E] rounded-full border-2 border-white shadow-md z-10"></div>
                    </div>
                 </div>
                 
                 <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm text-center">
                   Map view is simulated for demo
                 </div>
            </div>
          ) : (
            <div className="space-y-3">
              {MOCK_NGOS.map(ngo => (
                <div 
                  key={ngo.id} 
                  onClick={() => setSelectedNGO(ngo.id)}
                  className={`bg-white dark:bg-slate-800 rounded-[16px] p-5 border transition-all cursor-pointer ${selectedNGO === ngo.id ? 'border-[#1CAE9E] ring-1 ring-[#1CAE9E] shadow-md bg-[#1CAE9E]/5 dark:bg-[#1CAE9E]/10' : 'border-transparent shadow-[0_2px_4px_rgba(0,0,0,0.05)]'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="font-bold text-lg text-[#212121] dark:text-white">{ngo.name}</h3>
                        </div>
                        <span className="text-[#757575] dark:text-slate-400 text-sm font-medium">{ngo.distance} away</span>
                    </div>
                    <div className="bg-[#FFC107]/20 text-[#212121] dark:text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      ★ {ngo.rating}
                    </div>
                  </div>
                  
                  {ngo.urgency && (
                      <div className="inline-flex items-center gap-1.5 bg-[#F44336]/10 text-[#F44336] px-3 py-1.5 rounded-lg text-xs font-bold border border-[#F44336]/20 mb-4">
                          <AlertCircle size={12} />
                          {ngo.urgency}
                      </div>
                  )}
                  
                  <div className="flex justify-end">
                      <button 
                          className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${selectedNGO === ngo.id ? 'bg-[#1CAE9E] text-white' : 'bg-[#F5F5F5] dark:bg-slate-700 text-[#757575] dark:text-slate-300'}`}
                      >
                          {selectedNGO === ngo.id ? 'Selected' : 'Select Partner'}
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="fixed bottom-24 md:bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[600px] md:relative flex gap-3 z-40">
            <button 
              onClick={() => setStep(1)}
              className="flex-1 bg-white dark:bg-slate-800 text-[#757575] dark:text-slate-300 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={() => setStep(3)}
              disabled={!selectedNGO}
              className="flex-1 bg-[#1CAE9E] text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-200 dark:shadow-teal-900/40 hover:bg-[#179c8d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOGISTICS (NO PAYMENT) */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <p className="text-[#757575] dark:text-slate-400 text-sm font-medium">How will the food get there?</p>

          {/* Logistics Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
                type="button"
                onClick={() => setDeliveryMethod('dropoff')}
                className={`p-4 rounded-[16px] border flex flex-col items-center gap-2 transition-all ${deliveryMethod === 'dropoff' ? 'bg-[#1CAE9E]/10 border-[#1CAE9E] text-[#1CAE9E]' : 'bg-white dark:bg-slate-800 border-transparent shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#757575] dark:text-slate-400'}`}
            >
                <Package size={24} />
                <span className="font-bold text-sm">Self Drop-off</span>
            </button>
            <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-[16px] border flex flex-col items-center gap-2 transition-all ${deliveryMethod === 'pickup' ? 'bg-[#1CAE9E]/10 border-[#1CAE9E] text-[#1CAE9E]' : 'bg-white dark:bg-slate-800 border-transparent shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#757575] dark:text-slate-400'}`}
            >
                <Truck size={24} />
                <span className="font-bold text-sm">Request Pickup</span>
            </button>
          </div>

          <div className="bg-[#212121] dark:bg-slate-900 text-white p-6 rounded-[20px] shadow-xl">
            <h2 className="text-xl font-bold mb-1">Total Cost to You</h2>
            <div className="flex items-baseline gap-1">
               <span className="text-4xl font-bold text-[#1CAE9E]">$0</span>
               <span className="text-[#757575] dark:text-slate-500">.00</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-sm text-gray-400">
               <span>Logistics Fee</span>
               <span className="text-[#1CAE9E] font-bold">Covered by Partner</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pb-20 md:pb-0">
            {deliveryMethod === 'pickup' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[16px] shadow-sm border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                <h3 className="font-bold text-[#212121] dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    Pickup Instructions
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <textarea 
                          value={pickupNote}
                          onChange={(e) => setPickupNote(e.target.value)}
                          placeholder="Note for driver (e.g. Gate code)"
                          className="w-full bg-[#F5F5F5] dark:bg-slate-700 border-transparent rounded-xl px-4 py-3 text-[#212121] dark:text-white focus:ring-2 focus:ring-[#1CAE9E] outline-none h-24 resize-none text-sm placeholder-[#999] dark:placeholder-slate-400"
                        />
                    </div>
                </div>
                </div>
            )}

            <div className="flex gap-3 pt-2 fixed bottom-24 md:bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[600px] md:relative z-40">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-white dark:bg-slate-800 text-[#757575] dark:text-slate-300 py-4 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={isProcessing}
                className="flex-[2] bg-[#1CAE9E] text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-200 dark:shadow-teal-900/40 hover:bg-[#179c8d] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? 'Processing...' : (
                    deliveryMethod === 'pickup' 
                        ? 'Confirm Free Pickup' 
                        : 'Confirm Drop-off'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Donation;