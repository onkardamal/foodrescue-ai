import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, NGO, FoodCategory } from '../types';
import { ChevronLeft, Check, ShoppingBag, Map as MapIcon, List, MapPin, AlertCircle, Star, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { searchNearbyNGOs } from '../services/geminiService';

// Fix Leaflet's default icon path issues
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DonationProps {
  inventory: FoodItem[];
  onDonateComplete: (itemIds: string[], amount: number) => void;
}

// Initial Mock Data (Fallback)
const DEFAULT_NGOS: NGO[] = [
  { id: '1', name: "Helping Hands Shelter", distance: "1.2 km", urgency: "High", lat: 37.7749, lng: -122.4194, description: "Shelter", needs: [], rating: 4.8 },
  { id: '2', name: "City Food Bank", distance: "3.5 km", urgency: "Medium", lat: 37.7849, lng: -122.4094, description: "Food Bank", needs: [], rating: 4.5 },
  { id: '3', name: "Green Earth Rescue", distance: "5.0 km", urgency: "Low", lat: 37.7649, lng: -122.4294, description: "Community Fridge", needs: [], rating: 4.9 },
  { id: '4', name: "St. Mary's Kitchen", distance: "2.1 km", urgency: "High", lat: 37.7699, lng: -122.4100, description: "Soup Kitchen", needs: [], rating: 4.7 },
];

// --- Component: Stepper ---
const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [1, 2, 3];
  
  return (
    <div className="flex items-center justify-center h-[48px] mt-[12px]">
      {steps.map((step, index) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        
        let bgColor = '#E0E0E0'; // Upcoming
        let textColor = '#757575';

        if (isCompleted) {
            bgColor = '#EC4899'; // Pink
            textColor = '#FFFFFF';
        } else if (isActive) {
            bgColor = '#1CAE9E'; // Teal
            textColor = '#FFFFFF';
        }

        return (
          <React.Fragment key={step}>
            {/* Circle Node */}
            <div 
                className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-bold z-10 transition-colors duration-300"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
              {isCompleted ? <Check size={14} strokeWidth={3} /> : step}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`w-[40px] h-[2px] mx-[4px] transition-colors duration-300 ${isCompleted ? 'bg-[#EC4899]' : 'bg-[#E0E0E0]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// --- Component: Donation Item Row ---
const DonationItemRow: React.FC<{
  item: FoodItem;
  selected: boolean;
  onToggle: (id: string) => void;
}> = ({ item, selected, onToggle }) => {
  const expiryDate = new Date(item.expiryDate).toLocaleDateString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric'
  });

  return (
    <div 
        onClick={() => onToggle(item.id)}
        className={`h-[84px] w-full px-[16px] mb-[8px] flex items-center border-b border-[#EEEEEE] dark:border-slate-800 transition-colors duration-200 cursor-pointer ${
            selected ? 'bg-[#F0FFFB] dark:bg-[#1CAE9E]/10' : 'bg-white dark:bg-slate-900'
        }`}
        role="checkbox"
        aria-checked={selected}
    >
        {/* Checkbox */}
        <div className={`w-[24px] h-[24px] rounded-[4px] border-[2px] flex items-center justify-center transition-colors ${
            selected ? 'bg-[#1CAE9E] border-[#1CAE9E]' : 'border-[#BDBDBD] bg-transparent'
        }`}>
            {selected && <Check size={16} color="white" strokeWidth={3} />}
        </div>

        {/* Content */}
        <div className="ml-[12px] flex-1 min-w-0">
            <h3 className="text-[16px] font-[600] text-[#212121] dark:text-white truncate">{item.name}</h3>
            <p className="text-[14px] font-[400] text-[#757575] dark:text-slate-400 mt-[2px]">
                {item.quantity} {item.unit}
            </p>
        </div>

        {/* Expiry Badge */}
        <div className="bg-[#F5F5F5] dark:bg-slate-800 rounded-[4px] px-[8px] py-[4px] ml-[8px]">
            <span className="text-[12px] font-[500] text-[#757575] dark:text-slate-400">Exp: {expiryDate}</span>
        </div>
    </div>
  );
};

const Donation: React.FC<DonationProps> = ({ inventory, onDonateComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Step 2 State
  const [ngos, setNgos] = useState<NGO[]>(DEFAULT_NGOS);
  const [loadingNGOs, setLoadingNGOs] = useState(false);
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const donatableItems = inventory.filter(i => i.status === 'active');

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
    else navigate(-1);
  };

  const handleContinue = () => {
      if (currentStep < 3) {
          setCurrentStep(prev => prev + 1);
      } else {
          // Finish
          onDonateComplete(selectedItems, selectedItems.length * 10);
          navigate('/');
      }
  };

  // Fetch NGOs when entering Step 2
  useEffect(() => {
    if (currentStep === 2) {
        setLoadingNGOs(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const results = await searchNearbyNGOs(latitude, longitude);
                    if (results.length > 0) {
                        setNgos(results);
                    }
                } catch (e) {
                    console.error("Failed to fetch NGOs", e);
                } finally {
                    setLoadingNGOs(false);
                }
            }, (err) => {
                console.warn("Geolocation failed", err);
                setLoadingNGOs(false);
            });
        } else {
            setLoadingNGOs(false);
        }
    }
  }, [currentStep]);

  // Map Effect
  useEffect(() => {
    if (currentStep === 2 && viewMode === 'map' && mapContainerRef.current) {
        if (mapRef.current) mapRef.current.remove();

        const map = L.map(mapContainerRef.current, {
             zoomControl: false,
             attributionControl: false
        }).setView([37.7749, -122.4194], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
             attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Center map if we have real data coordinates
        if (ngos.length > 0 && ngos[0].id.startsWith('real')) {
             map.setView([ngos[0].lat, ngos[0].lng], 13);
        }

        ngos.forEach(ngo => {
            const marker = L.marker([ngo.lat, ngo.lng])
                .addTo(map)
                .on('click', () => {
                     setSelectedNgoId(ngo.id);
                });
            
            if (ngo.id === selectedNgoId) {
                marker.openPopup();
            }
        });

        mapRef.current = map;
    }
    
    return () => {
        mapRef.current?.remove();
        mapRef.current = null;
    }
  }, [currentStep, viewMode, ngos]);

  // Step 1: Select Items
  const renderStep1 = () => (
    <>
        <div className="ml-[16px] mt-[24px] mb-[8px]">
            <h2 className="text-[20px] font-[700] text-[#212121] dark:text-white">Select Items to Donate</h2>
            <p className="text-[14px] text-[#757575] dark:text-slate-400 mt-[2px]">Tap items to add to donation</p>
        </div>

        <div className="flex-1 overflow-y-auto pb-[100px]">
            {donatableItems.length > 0 ? (
                donatableItems.map(item => (
                    <DonationItemRow 
                        key={item.id} 
                        item={item} 
                        selected={selectedItems.includes(item.id)} 
                        onToggle={handleToggleItem} 
                    />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center pt-[60px] px-[32px] text-center">
                     <ShoppingBag size={48} className="text-[#E0E0E0] mb-[16px]" />
                     <h3 className="text-[16px] font-[600] text-[#212121] dark:text-white mb-[8px]">No items in your inventory</h3>
                     <button 
                        onClick={() => navigate('/inventory')}
                        className="bg-[#1CAE9E] text-white h-[44px] px-[24px] rounded-[8px] font-[600] text-[14px]"
                     >
                        Add Food Items
                     </button>
                </div>
            )}
        </div>
    </>
  );

  // Step 2: Choose Recipient
  const renderStep2 = () => (
    <div className="flex flex-col h-full overflow-hidden">
        {/* Step Header & Toggle */}
        <div className="px-[16px] mt-[24px] mb-[16px] flex justify-between items-end">
             <div>
                <h2 className="text-[20px] font-[700] text-[#212121] dark:text-white">Choose Recipient</h2>
                <p className="text-[14px] text-[#757575] dark:text-slate-400 mt-[2px]">Who receives this donation?</p>
             </div>
             
             <div className="flex bg-[#F5F5F5] dark:bg-slate-800 p-1 rounded-lg">
                 <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#1CAE9E]' : 'text-[#757575] dark:text-slate-400'}`}
                 >
                     <List size={20} />
                 </button>
                 <button 
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#1CAE9E]' : 'text-[#757575] dark:text-slate-400'}`}
                 >
                     <MapIcon size={20} />
                 </button>
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-[100px] relative">
            {loadingNGOs && viewMode === 'list' && (
                 <div className="px-[16px] mb-4 flex items-center gap-2 text-[#1CAE9E]">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">Finding nearby organizations...</span>
                 </div>
            )}

            {viewMode === 'list' ? (
                <div className="px-[16px] space-y-[12px]">
                    {ngos.map(ngo => (
                        <div 
                            key={ngo.id}
                            onClick={() => setSelectedNgoId(ngo.id)}
                            className={`p-[16px] rounded-[12px] border transition-all cursor-pointer flex justify-between items-center ${
                                selectedNgoId === ngo.id 
                                ? 'bg-[#F0FFFB] dark:bg-[#1CAE9E]/20 border-[#1CAE9E]' 
                                : 'bg-white dark:bg-slate-800 border-[#EEEEEE] dark:border-slate-700 hover:border-[#1CAE9E]/50'
                            }`}
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-[600] text-[#212121] dark:text-white">{ngo.name}</h3>
                                    {ngo.urgency === 'High' && (
                                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <AlertCircle size={10} /> High Need
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[13px] text-[#757575] dark:text-slate-400">
                                    <span className="flex items-center gap-1"><MapPin size={12} /> {ngo.distance}</span>
                                    <span>•</span>
                                    <span>{ngo.description || ngo.name}</span>
                                </div>
                            </div>
                            
                            {selectedNgoId === ngo.id ? (
                                <div className="w-[24px] h-[24px] rounded-full bg-[#1CAE9E] flex items-center justify-center">
                                    <Check size={14} color="white" strokeWidth={3} />
                                </div>
                            ) : (
                                <div className="w-[24px] h-[24px] rounded-full border-2 border-[#E0E0E0] dark:border-slate-600" />
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div ref={mapContainerRef} className="w-full h-full bg-[#E0E0E0] dark:bg-slate-800 relative">
                     {loadingNGOs && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                            <Loader2 className="animate-spin text-[#1CAE9E]" size={16} />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Searching area...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="h-screen bg-white dark:bg-slate-950 flex flex-col relative">
      {/* A. Header */}
      <header className="pt-[12px] px-[16px] flex flex-col items-center relative z-20 bg-white dark:bg-slate-950">
         <div className="w-full h-[44px] flex items-center justify-between">
            <button 
                onClick={handleBack}
                className="w-[44px] h-[44px] flex items-center justify-center -ml-[12px] rounded-full active:bg-slate-100 dark:active:bg-slate-800"
            >
                <ChevronLeft size={24} className="text-[#212121] dark:text-white" />
            </button>
            <h1 className="text-[18px] font-[700] text-[#212121] dark:text-white absolute left-0 right-0 text-center pointer-events-none">
                {currentStep === 1 ? 'Donate Food' : currentStep === 2 ? 'Select Recipient' : 'Confirm'}
            </h1>
            <div className="w-[44px]" /> 
         </div>
      </header>

      {/* B. Stepper */}
      <Stepper currentStep={currentStep} />

      {/* Main Content Area */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                  <Check size={40} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#212121] dark:text-white">Ready to Donate!</h2>
              <p className="text-[#757575] dark:text-slate-400 mb-8">
                  You are donating <strong>{selectedItems.length} items</strong> to <strong>{ngos.find(n => n.id === selectedNgoId)?.name}</strong>.
              </p>
          </div>
      )}

      {/* E. Sticky Footer */}
      {(donatableItems.length > 0) && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-950 pt-[16px] pb-[32px] px-[16px] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-slate-100 dark:border-slate-800 z-30">
              <button 
                onClick={handleContinue}
                disabled={
                    (currentStep === 1 && selectedItems.length === 0) ||
                    (currentStep === 2 && !selectedNgoId)
                }
                className="w-full h-[52px] bg-[#1CAE9E] rounded-[10px] flex items-center justify-center text-white text-[16px] font-[600] disabled:bg-[#BDBDBD] disabled:text-white/60 active:scale-[0.98] transition-all"
              >
                {currentStep === 3 ? 'Confirm Donation' : 'Continue'}
              </button>
          </div>
      )}
    </div>
  );
};

export default Donation;