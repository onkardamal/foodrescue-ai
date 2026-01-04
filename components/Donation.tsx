
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="text-green-600 w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Donation Confirmed!</h2>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto">
          {deliveryMethod === 'pickup' 
            ? 'A volunteer driver has been notified and will arrive shortly.' 
            : 'Thank you for dropping off the food. The NGO is expecting you.'}
        </p>
        <div className="bg-slate-50 p-6 rounded-2xl w-full max-w-sm mb-8 border border-slate-100">
           <div className="flex justify-between mb-2">
             <span className="text-slate-500">Value Rescued</span>
             <span className="font-bold text-emerald-600">${foodValue}.00</span>
           </div>
           <div className="flex justify-between mb-2">
             <span className="text-slate-500">Items</span>
             <span className="font-bold text-slate-800">{selectedItems.length} items</span>
           </div>
           <div className="flex justify-between">
             <span className="text-slate-500">Recipient</span>
             <span className="font-bold text-slate-800">{MOCK_NGOS.find(n => n.id === selectedNGO)?.name}</span>
           </div>
        </div>
        <button 
          onClick={() => { setIsSuccess(false); setStep(1); setSelectedItems([]); setSelectedNGO(null); setDeliveryMethod('dropoff'); setPickupNote(''); }}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
        >
          Make Another Donation
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
              {step > s ? <CheckCircle size={20} /> : s}
            </div>
            <span className={`text-xs mt-2 font-medium ${step >= s ? 'text-indigo-600' : 'text-slate-400'}`}>
              {s === 1 ? 'Items' : s === 2 ? 'NGO' : 'Confirm'}
            </span>
          </div>
        ))}
        {/* Progress Line */}
        <div className="absolute left-8 right-8 top-9 h-0.5 bg-slate-200 -z-0">
          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
        </div>
      </div>

      {/* STEP 1: SELECT ITEMS */}
      {step === 1 && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <h2 className="text-2xl font-bold text-slate-800 px-1">Select Items to Donate</h2>
          <p className="text-slate-500 px-1 mb-4">Choose active items from your pantry.</p>
          
          <div className="grid gap-3">
            {donatableItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <ShoppingBag className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500">No active items to donate.</p>
              </div>
            ) : donatableItems.map(item => (
              <label key={item.id} className={`flex items-center p-4 bg-white rounded-2xl border transition-all cursor-pointer ${selectedItems.includes(item.id) ? 'border-indigo-600 shadow-md bg-indigo-50/30' : 'border-slate-100 shadow-sm'}`}>
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleItemToggle(item.id)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 mr-4"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{item.name}</div>
                  <div className="text-sm text-slate-500">{item.quantity} {item.unit} • Expires {new Date(item.expiryDate).toLocaleDateString()}</div>
                </div>
                <div className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded text-xs">
                  {item.category}
                </div>
              </label>
            ))}
          </div>

          <div className="fixed bottom-24 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Selected Value</p>
              <p className="font-bold text-slate-800 text-lg">~${selectedItems.length * 10}</p>
            </div>
            <button 
              onClick={() => setStep(2)}
              disabled={selectedItems.length === 0}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT NGO */}
      {step === 2 && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-2xl font-bold text-slate-800">Who should get this?</h2>
            {/* View Toggle */}
            <div className="flex bg-slate-200 p-1 rounded-xl">
                <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-2 rounded-lg transition-all flex items-center gap-1 ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                    <List size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('map')} 
                    className={`p-2 rounded-lg transition-all flex items-center gap-1 ${viewMode === 'map' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                    <MapIcon size={18} />
                </button>
            </div>
          </div>
          
          {viewMode === 'map' ? (
            <div className="h-[400px] bg-slate-100 rounded-3xl relative overflow-hidden mb-4 border border-slate-200 shadow-inner">
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 
                 {/* Current Location Pin */}
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex flex-col items-center">
                       <div className="w-32 h-32 bg-indigo-500/10 rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                       <MapPin className="text-indigo-600 drop-shadow-xl z-10" size={40} fill="currentColor" />
                       <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm mt-1 z-10">You</span>
                    </div>
                 </div>

                 {/* Mock Pins for NGOs */}
                 <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                     <MapPin className="text-red-500 drop-shadow-md" size={32} fill="currentColor" />
                 </div>
                 <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
                     <MapPin className="text-orange-500 drop-shadow-md" size={32} fill="currentColor" />
                 </div>
                 
                 <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-100">
                   1.2 km radius
                 </div>
            </div>
          ) : (
            <div className="space-y-4">
              {MOCK_NGOS.map(ngo => (
                <div 
                  key={ngo.id} 
                  onClick={() => setSelectedNGO(ngo.id)}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer ${selectedNGO === ngo.id ? 'border-indigo-600 ring-1 ring-indigo-600 shadow-md bg-indigo-50/10' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="font-bold text-lg text-slate-800">{ngo.name}</h3>
                            <span className="text-slate-400 text-sm font-medium">{ngo.distance} away</span>
                        </div>
                    </div>
                    <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      ★ {ngo.rating}
                    </div>
                  </div>
                  
                  {ngo.urgency && (
                      <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-orange-100 mb-4">
                          <AlertCircle size={14} />
                          {ngo.urgency}
                      </div>
                  )}
                  
                  <div className="flex justify-end">
                      <button 
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${selectedNGO === ngo.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                          {selectedNGO === ngo.id ? 'Selected' : 'Select'}
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="fixed bottom-24 left-4 right-4 flex gap-3">
            <button 
              onClick={() => setStep(1)}
              className="flex-1 bg-white text-slate-600 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={() => setStep(3)}
              disabled={!selectedNGO}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOGISTICS (NO PAYMENT) */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <h2 className="text-2xl font-bold text-slate-800 px-1">Logistics</h2>

          {/* Logistics Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
                type="button"
                onClick={() => setDeliveryMethod('dropoff')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${deliveryMethod === 'dropoff' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
                <Package size={24} />
                <span className="font-bold text-sm">Self Drop-off</span>
                <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Free</span>
            </button>
            <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${deliveryMethod === 'pickup' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
                <Truck size={24} />
                <span className="font-bold text-sm">Request Pickup</span>
                <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Sponsored</span>
            </button>
          </div>

          <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold mb-1">Total Cost to You</h2>
            <div className="flex items-baseline gap-1">
               <span className="text-4xl font-bold">$0</span>
               <span className="text-slate-400">.00</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-sm text-slate-300">
               <span>Logistics Fee</span>
               <span className="text-emerald-400 font-bold">Covered by Partner NGO</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {deliveryMethod === 'pickup' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-indigo-600" /> Pickup Instructions
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Notes (Optional)</label>
                        <textarea 
                          value={pickupNote}
                          onChange={(e) => setPickupNote(e.target.value)}
                          placeholder="e.g. Gate code is 1234, please leave crate at front door."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                        />
                    </div>
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
                    <ShieldCheck size={14} className="text-emerald-500" /> Verified Volunteer Driver
                </div>
                </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-white text-slate-600 py-4 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={isProcessing}
                className="flex-[2] bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
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
