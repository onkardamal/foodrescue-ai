
import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, NGO, FoodCategory } from '../types';
import { ChevronLeft, Check, ShoppingBag, Map as MapIcon, List, MapPin, AlertCircle, Star, Loader2, Phone, Calendar, Truck, MessageSquare, Clock, MapPinned } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import { searchNearbyNGOs, reverseGeocode } from '../services/geminiService';

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
  { id: '1', name: "Helping Hands Shelter", distance: "1.2 km", urgency: "High", lat: 37.7749, lng: -122.4194, description: "Shelter", needs: [], rating: 4.8, phone: "+1 (555) 123-4567" },
  { id: '2', name: "City Food Bank", distance: "3.5 km", urgency: "Medium", lat: 37.7849, lng: -122.4094, description: "Food Bank", needs: [], rating: 4.5, phone: "+1 (555) 987-6543" },
  { id: '3', name: "Green Earth Rescue", distance: "5.0 km", urgency: "Low", lat: 37.7649, lng: -122.4294, description: "Community Fridge", needs: [], rating: 4.9, phone: "+1 (555) 456-7890" },
  { id: '4', name: "St. Mary's Kitchen", distance: "2.1 km", urgency: "High", lat: 37.7699, lng: -122.4100, description: "Soup Kitchen", needs: [], rating: 4.7, phone: "+1 (555) 789-0123" },
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
            bgColor = '#00796B'; // Completed (Teal)
            textColor = '#FFFFFF';
        } else if (isActive) {
            bgColor = '#00796B'; // Active (Teal)
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
              <div className={`w-[40px] h-[2px] mx-[4px] transition-colors duration-300 ${isCompleted ? 'bg-[#00796B]' : 'bg-[#E0E0E0]'}`} />
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
            selected ? 'bg-[#F0FFFB] dark:bg-[#00796B]/10' : 'bg-white dark:bg-slate-900'
        }`}
        role="checkbox"
        aria-checked={selected}
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(item.id);
            }
        }}
    >
        {/* Checkbox */}
        <div className={`w-[24px] h-[24px] rounded-[4px] border-[2px] flex items-center justify-center transition-colors ${
            selected ? 'bg-[#00796B] border-[#00796B]' : 'border-[#BDBDBD] bg-transparent'
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
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Step 2 State
  const [ngos, setNgos] = useState<NGO[]>(DEFAULT_NGOS);
  const [loadingNGOs, setLoadingNGOs] = useState(false);
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Step 3 State (Logistics)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [logistics, setLogistics] = useState({
      mode: 'dropoff' as 'dropoff' | 'pickup',
      contactPhone: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      pickupLocation: ''
  });

  const donatableItems = inventory.filter(i => i.status === 'active');

  // Handle pre-selection from Map & Inventory
  useEffect(() => {
      // Handle pre-selected NGO
      if (location.state?.preSelectedNgo) {
          const pre = location.state.preSelectedNgo;
          setNgos(prev => {
              if (prev.find(n => n.id === pre.id)) return prev;
              return [pre, ...prev];
          });
          setSelectedNgoId(pre.id);
      }
      
      // Handle pre-selected Items from Inventory
      if (location.state?.preSelectedItemIds) {
          setSelectedItems(location.state.preSelectedItemIds);
      }
  }, [location.state]);

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
          // Finish (Step 3 -> 4 happens via state, not navigation)
          onDonateComplete(selectedItems, selectedItems.length * 10);
          setCurrentStep(4); // Show Success Screen
      }
  };

  const fetchPickupLocation = () => {
    setIsFetchingLocation(true);
    setLogistics(prev => ({ ...prev, mode: 'pickup', pickupLocation: 'Locating address...' }));
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const address = await reverseGeocode(latitude, longitude);
                    setLogistics(prev => ({
                        ...prev,
                        pickupLocation: address
                    }));
                } catch (error) {
                    setLogistics(prev => ({
                        ...prev,
                        pickupLocation: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    }));
                } finally {
                    setIsFetchingLocation(false);
                }
            },
            (error) => {
                console.error("Location error", error);
                setLogistics(prev => ({
                    ...prev,
                    pickupLocation: "Location access denied. Please type address."
                }));
                setIsFetchingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        setLogistics(prev => ({ ...prev, pickupLocation: "Geolocation not supported." }));
        setIsFetchingLocation(false);
    }
  };

  const handleModeChange = (mode: 'dropoff' | 'pickup') => {
      if (mode === 'pickup') {
          fetchPickupLocation();
      } else {
          setLogistics(prev => ({ ...prev, mode, pickupLocation: '' }));
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

  // Validation helper for phone number
  const isPhoneValid = logistics.contactPhone.length === 10;

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
                        className="bg-[#00796B] text-white h-[44px] px-[24px] rounded-[8px] font-[600] text-[14px]"
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
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#00796B]' : 'text-[#757575] dark:text-slate-400'}`}
                    aria-label="List View"
                 >
                     <List size={20} />
                 </button>
                 <button 
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#00796B]' : 'text-[#757575] dark:text-slate-400'}`}
                    aria-label="Map View"
                 >
                     <MapIcon size={20} />
                 </button>
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-[100px] relative">
            {loadingNGOs && viewMode === 'list' && (
                 <div className="px-[16px] mb-4 flex items-center gap-2 text-[#00796B]">
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
                                ? 'bg-[#F0FFFB] dark:bg-[#00796B]/20 border-[#00796B]' 
                                : 'bg-white dark:bg-slate-900 border-[#EEEEEE] dark:border-slate-700 hover:border-[#00796B]/50'
                            }`}
                            tabIndex={0}
                            role="radio"
                            aria-checked={selectedNgoId === ngo.id}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedNgoId(ngo.id);
                                }
                            }}
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
                                <div className="w-[24px] h-[24px] rounded-full bg-[#00796B] flex items-center justify-center">
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
                            <Loader2 className="animate-spin text-[#00796B]" size={16} />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Searching area...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );

  // Step 3: Logistics & Contact
  const renderStep3 = () => {
      const selectedNgo = ngos.find(n => n.id === selectedNgoId);
      const digits = logistics.contactPhone.replace(/\D/g, '');
      const showError = logistics.contactPhone.length > 0 && !isPhoneValid;

      return (
        <div className="flex-1 overflow-y-auto px-[16px] pb-[100px]">
            <div className="mt-[24px] mb-[20px]">
                <h2 className="text-[20px] font-[700] text-[#212121] dark:text-white">Coordinate Handover</h2>
                <p className="text-[14px] text-[#757575] dark:text-slate-400 mt-[2px]">How will {selectedNgo?.name} receive this?</p>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                    onClick={() => handleModeChange('dropoff')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${logistics.mode === 'dropoff' ? 'bg-[#00796B] border-[#00796B] text-white shadow-md' : 'bg-white dark:bg-slate-800 border-[#EEEEEE] dark:border-slate-700 text-[#757575]'}`}
                >
                    <MapPin size={24} />
                    <span className="font-bold text-sm">I'll Drop Off</span>
                </button>
                <button
                    onClick={() => handleModeChange('pickup')}
                    disabled={isFetchingLocation}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all relative ${logistics.mode === 'pickup' ? 'bg-[#00796B] border-[#00796B] text-white shadow-md' : 'bg-white dark:bg-slate-800 border-[#EEEEEE] dark:border-slate-700 text-[#757575]'}`}
                >
                    {isFetchingLocation ? <Loader2 size={24} className="animate-spin" /> : <Truck size={24} />}
                    <span className="font-bold text-sm">Request Pickup</span>
                    {logistics.mode === 'pickup' && !isFetchingLocation && (
                        <div className="absolute top-1 right-1">
                            <Check size={12} className="text-white" />
                        </div>
                    )}
                </button>
            </div>

            {/* Contact Details Form */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-[#212121] dark:text-white mb-2 flex items-center gap-2">
                        <Phone size={16} /> Contact Phone (10 digits)
                    </label>
                    <input 
                        type="tel" 
                        placeholder="e.g. 5550123456"
                        value={logistics.contactPhone}
                        maxLength={10}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setLogistics({...logistics, contactPhone: val});
                        }}
                        className={`w-full h-[48px] px-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 border-2 outline-none transition-all font-medium ${
                            showError ? 'border-red-500 focus:ring-red-500/20' : 'border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-[#00796B]/20 focus:border-[#00796B]'
                        }`}
                    />
                    {showError && (
                        <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1 animate-in slide-in-from-top-1">
                            Please enter exactly 10 digits (currently {digits.length})
                        </p>
                    )}
                </div>

                {logistics.mode === 'pickup' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-[#212121] dark:text-white mb-2 flex items-center gap-2">
                            <MapPinned size={16} /> Pickup Address
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={logistics.pickupLocation}
                                onChange={(e) => setLogistics({...logistics, pickupLocation: e.target.value})}
                                placeholder="Auto-fetching location..."
                                className="w-full h-[48px] px-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-[#00796B] outline-none transition-all font-medium"
                            />
                            {isFetchingLocation && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#00796B]" />}
                        </div>
                        {logistics.pickupLocation && !isFetchingLocation && (
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                Detected address via AI geolocation. You can edit this if needed.
                            </p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-[#212121] dark:text-white mb-2 flex items-center gap-2">
                            <Calendar size={16} /> Date
                        </label>
                        <input 
                            type="date" 
                            value={logistics.date}
                            onChange={(e) => setLogistics({...logistics, date: e.target.value})}
                            className="w-full h-[48px] px-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#00796B] outline-none transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#212121] dark:text-white mb-2 flex items-center gap-2">
                            <Clock size={16} /> Time
                        </label>
                        <input 
                            type="time" 
                            value={logistics.time}
                            onChange={(e) => setLogistics({...logistics, time: e.target.value})}
                            className="w-full h-[48px] px-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#00796B] outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#212121] dark:text-white mb-2 flex items-center gap-2">
                        <MessageSquare size={16} /> Notes for NGO
                    </label>
                    <textarea 
                        placeholder={logistics.mode === 'pickup' ? "Gate code, parking info..." : "Estimated arrival time, specific bags..."}
                        value={logistics.notes}
                        onChange={(e) => setLogistics({...logistics, notes: e.target.value})}
                        className="w-full h-[80px] p-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#00796B] outline-none transition-all font-medium resize-none"
                    />
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    By confirming, we will send an automated SMS and Email to <strong>{selectedNgo?.name}</strong> with these details. They will contact you at the provided number to confirm the {logistics.mode}.
                </p>
            </div>
        </div>
      );
  }

  // Step 4: Success
  const renderStep4 = () => {
      const selectedNgo = ngos.find(n => n.id === selectedNgoId);
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200 dark:shadow-green-900/10">
                  <Check size={48} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#212121] dark:text-white">Request Sent!</h2>
              <div className="bg-[#F5F5F5] dark:bg-slate-800 px-4 py-2 rounded-full mb-6">
                  <span className="text-sm font-mono font-bold text-[#757575] dark:text-slate-400">ID: DON-{Math.floor(1000 + Math.random() * 9000)}</span>
              </div>
              <p className="text-[#757575] dark:text-slate-300 mb-8 leading-relaxed max-w-xs mx-auto">
                  We have notified <strong>{selectedNgo?.name}</strong>. They have received your request for <strong>{logistics.mode}</strong> and will call you at <span className="font-bold whitespace-nowrap">{logistics.contactPhone || "your number"}</span> shortly.
              </p>
              
              <div className="w-full max-w-xs space-y-3">
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full h-[52px] bg-[#00796B] rounded-xl text-white font-bold shadow-lg shadow-teal-500/30 hover:bg-[#00695C] transition-all"
                  >
                      Return to Dashboard
                  </button>
                  <button 
                    onClick={() => window.open(`tel:${selectedNgo?.phone || '555-0123'}`)}
                    className="w-full h-[52px] border border-[#00796B] text-[#00796B] rounded-xl font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all flex items-center justify-center gap-2"
                  >
                      <Phone size={18} /> Call NGO Now
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-screen bg-white dark:bg-slate-950 flex flex-col relative">
      {/* A. Header */}
      {currentStep < 4 && (
        <header className="pt-[12px] px-[16px] flex flex-col items-center relative z-20 bg-white dark:bg-slate-950">
            <div className="w-full h-[44px] flex items-center justify-between">
                <button 
                    onClick={handleBack}
                    className="w-[44px] h-[44px] flex items-center justify-center -ml-[12px] rounded-full active:bg-slate-100 dark:active:bg-slate-800"
                    aria-label="Back"
                >
                    <ChevronLeft size={24} className="text-[#212121] dark:text-white" />
                </button>
                <h1 className="text-[18px] font-[700] text-[#212121] dark:text-white absolute left-0 right-0 text-center pointer-events-none">
                    {currentStep === 1 ? 'Donate Food' : currentStep === 2 ? 'Select Recipient' : 'Logistics'}
                </h1>
                <div className="w-[44px]" /> 
            </div>
        </header>
      )}

      {/* B. Stepper */}
      {currentStep < 4 && <Stepper currentStep={currentStep} />}

      {/* Main Content Area */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* E. Sticky Footer */}
      {(donatableItems.length > 0 && currentStep < 4) && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-950 pt-[16px] pb-[32px] px-[16px] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-slate-100 dark:border-slate-800 z-30">
              <button 
                onClick={handleContinue}
                disabled={
                    (currentStep === 1 && selectedItems.length === 0) ||
                    (currentStep === 2 && !selectedNgoId) ||
                    (currentStep === 3 && (!logistics.contactPhone || !logistics.date || !logistics.time || !isPhoneValid || (logistics.mode === 'pickup' && !logistics.pickupLocation) || isFetchingLocation))
                }
                className="w-full h-[52px] bg-[#00796B] rounded-[10px] flex items-center justify-center text-white text-[16px] font-[600] disabled:bg-[#BDBDBD] disabled:text-white/60 active:scale-[0.98] transition-all"
              >
                {currentStep === 3 ? 'Confirm Donation' : 'Continue'}
              </button>
          </div>
      )}
    </div>
  );
};

export default Donation;
