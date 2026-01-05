import React, { useState, useEffect } from 'react';
import { UserStats, FoodItem, User } from '../types';
import { Leaf, DollarSign, Share2, Utensils, Bell, Menu, ArrowUp, Plus, Camera, Heart, BookOpen, MapPin, BarChart3, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { ALL_BADGES } from './Badges'; // Import badge constants

interface DashboardProps {
  user: User | null;
  stats: UserStats;
  inventory: FoodItem[];
}

const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const duration = 1500; // 1.5 seconds animation

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      // Ease out cubic
      const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
      
      if (progress < duration) {
        const timeRatio = progress / duration;
        const easedProgress = easeOutCubic(timeRatio);
        setCount(easedProgress * value);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
};

const Dashboard: React.FC<DashboardProps> = ({ user, stats, inventory }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  // Get Expiring Items (Real Data)
  const expiringItems = inventory
    .filter(item => item.status === 'active')
    .map(item => {
        const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return { ...item, daysLeft: days };
    })
    .filter(item => item.daysLeft <= 4)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3); // Show top 3
    
  // Get Earned Badge Objects
  const earnedBadgeObjects = ALL_BADGES.filter(b => stats.earnedBadges.includes(b.id));

  return (
    <div className="flex flex-col pt-[20px] md:pt-0 px-[16px] md:px-0 gap-[24px] animate-in fade-in duration-500 relative">
      
      {/* 2) Header and Welcome Area */}
      <header className="flex md:hidden justify-between items-center relative z-50">
        <div className="flex items-center gap-[12px]">
            <div className="w-[48px] h-[48px] bg-[#00796B] rounded-full flex items-center justify-center shadow-md shadow-teal-100 dark:shadow-teal-900/20">
                <Leaf size={24} color="white" fill="white" />
            </div>
            <h1 className="font-semibold text-[20px] text-[#212121] dark:text-white">FoodSaver</h1>
        </div>
        <div className="flex items-center gap-[12px]">
             {/* Interactive Notification Bell */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all relative outline-none"
                    aria-label="Notifications"
                    aria-expanded={showNotifications}
                    aria-haspopup="true"
                >
                    <Bell size={24} className="text-[#757575] dark:text-slate-400" />
                    {expiringItems.length > 0 && (
                        <div className="absolute top-[2px] right-[2px] w-[16px] h-[16px] bg-[#D32F2F] rounded-full border-[2px] border-white dark:border-slate-900 flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">{expiringItems.length}</span>
                        </div>
                    )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
                        <div 
                            className="absolute right-0 top-full mt-2 w-[280px] bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Notifications"
                        >
                             <div className="p-3 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-[#212121] dark:text-white text-xs uppercase tracking-wider">Notifications</h3>
                                {expiringItems.length > 0 && <span className="text-[10px] bg-[#00796B] text-white px-2 py-0.5 rounded-full font-bold">{expiringItems.length} new</span>}
                            </div>
                            <div className="max-h-[320px] overflow-y-auto">
                                {expiringItems.length > 0 ? (
                                    expiringItems.map(item => (
                                         <button 
                                            key={item.id}
                                            onClick={() => navigate('/inventory')}
                                            className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors flex gap-3 group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <span className="text-lg">⚠️</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-[#212121] dark:text-white leading-tight">{item.name}</p>
                                                <p className="text-xs text-[#757575] dark:text-slate-400 mt-1">Expiring in <span className="text-[#C2410C] font-bold">{item.daysLeft} days</span></p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-[#757575] dark:text-slate-400">
                                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">You're all caught up!</p>
                                    </div>
                                )}
                            </div>
                            {expiringItems.length > 0 && (
                                <div className="p-2 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-center">
                                    <button onClick={() => navigate('/inventory')} className="text-xs font-bold text-[#00796B] hover:underline">View Inventory</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* User Profile Link */}
            <button 
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                aria-label="View Profile"
            >
                <img 
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                />
            </button>
        </div>
      </header>

      <div className="flex flex-wrap justify-between items-end gap-4 mt-2">
          <div>
            <h2 className="font-bold text-[32px] md:text-[40px] text-[#212121] dark:text-white leading-[1.2] mb-[8px]">
                Welcome back,<br />{user?.name.split(' ')[0] || 'Chef'} 👋
            </h2>
            <p className="font-normal text-[13px] md:text-[16px] text-[#757575] dark:text-slate-400">
                You've saved <AnimatedCounter value={stats.mealsSaved} /> meals this month!
            </p>
          </div>
          <button 
            onClick={() => navigate('/inventory')}
            className="bg-[#00796B] hover:bg-[#00695C] text-white font-bold text-[16px] px-[24px] py-[14px] rounded-[20px] shadow-lg shadow-teal-500/20 dark:shadow-teal-900/40 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all min-h-[48px]"
            aria-label="Add food to inventory"
          >
            Add Food
          </button>
      </div>

      {/* 3) Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
        {/* Card 1: Meals Saved */}
        <div className="bg-white dark:bg-slate-800 rounded-[20px] p-[16px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[120px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-[48px] h-[48px] rounded-full bg-[#00796B] flex items-center justify-center">
                <Utensils size={24} color="white" strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] dark:text-white mt-[12px]">
                    <AnimatedCounter value={stats.mealsSaved} />
                </div>
                <div className="font-normal text-[14px] text-[#757575] dark:text-slate-400">Meals Saved</div>
                <div className="flex items-center gap-1 mt-1 text-[#00796B] text-[12px]">
                    <ArrowUp size={12} strokeWidth={2} />
                    <span>+12% this week</span>
                </div>
            </div>
        </div>

        {/* Card 2: CO2 Prevented */}
        <div className="bg-white dark:bg-slate-800 rounded-[20px] p-[16px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[120px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-[48px] h-[48px] rounded-full bg-[#00796B] flex items-center justify-center">
                <Leaf size={24} color="white" strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] dark:text-white mt-[12px]">
                    <AnimatedCounter value={stats.co2Saved} suffix=" kg" decimals={1} />
                </div>
                <div className="font-normal text-[14px] text-[#757575] dark:text-slate-400">CO₂ Prevented</div>
                <div className="flex items-center gap-1 mt-1 text-[#00796B] text-[12px]">
                    <ArrowUp size={12} strokeWidth={2} />
                    <span>+12% this week</span>
                </div>
            </div>
        </div>

         {/* Card 3: Money Saved */}
         <div className="bg-white dark:bg-slate-800 rounded-[20px] p-[16px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[120px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-[48px] h-[48px] rounded-full bg-[#E65100] flex items-center justify-center">
                <DollarSign size={24} color="white" strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] dark:text-white mt-[12px]">
                    <AnimatedCounter value={stats.moneySaved} prefix="$" />
                </div>
                <div className="font-normal text-[14px] text-[#757575] dark:text-slate-400">Money Saved</div>
                <div className="flex items-center gap-1 mt-1 text-[#00796B] text-[12px]">
                    <ArrowUp size={12} strokeWidth={2} />
                    <span>+12% this week</span>
                </div>
            </div>
        </div>

         {/* Card 4: Food Rescued */}
         <div className="bg-white dark:bg-slate-800 rounded-[20px] p-[16px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[120px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-[48px] h-[48px] rounded-full bg-[#1565C0] flex items-center justify-center">
                <Share2 size={24} color="white" strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] dark:text-white mt-[12px]">0 kg</div>
                <div className="font-normal text-[14px] text-[#757575] dark:text-slate-400">Food Rescued</div>
                <div className="flex items-center gap-1 mt-1 text-[#00796B] text-[12px]">
                    <ArrowUp size={12} strokeWidth={2} />
                    <span>+12% this week</span>
                </div>
            </div>
        </div>
      </div>

      {/* 4) Quick Actions */}
      <div>
        <h3 className="font-bold text-[20px] text-[#212121] dark:text-white mb-[16px]">Quick Actions</h3>
        
        {/* Responsive Grid Layout for Actions */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-[12px]">
            {[
                { icon: Plus, color: '#00796B', darkColor: '#80CBC4', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', title: 'Add Item', path: '/inventory' },
                { icon: Camera, color: '#0288D1', darkColor: '#81D4FA', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800', title: 'Scan Food', path: '/inventory' },
                { icon: Heart, color: '#D32F2F', darkColor: '#EF9A9A', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', title: 'Donate', path: '/donate' },
                { icon: BookOpen, color: '#E65100', darkColor: '#FFCC80', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', title: 'Recipes', path: '/recipes' },
                { icon: MapPin, color: '#7B1FA2', darkColor: '#CE93D8', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', title: 'Find NGOs', path: '/ngos' },
                { icon: BarChart3, color: '#455A64', darkColor: '#B0BEC5', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', title: 'Analytics', path: '/analytics' }
            ].map((action, i) => (
                <button 
                    key={i}
                    onClick={() => navigate(action.path)}
                    className={`
                        ${action.bg} ${action.border} relative h-[110px] rounded-[24px] flex flex-col items-center justify-center p-2
                        transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-95 active:translate-y-0
                        group border
                    `}
                >
                    <div 
                        className="w-[48px] h-[48px] rounded-[18px] bg-white dark:bg-slate-950 shadow-sm flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300"
                    >
                        <action.icon size={24} strokeWidth={2.5} className="dark:hidden" style={{ color: action.color }} />
                        <action.icon size={24} strokeWidth={2.5} className="hidden dark:block" style={{ color: action.darkColor }} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-tight text-center">
                        {action.title}
                    </span>
                </button>
            ))}
        </div>
      </div>

      {/* 5) Layout Split for Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expiring Soon */}
          <div>
            <div className="flex justify-between items-baseline mb-[12px]">
                <h3 className="font-bold text-[20px] text-[#212121] dark:text-white">Expiring Soon</h3>
                <button onClick={() => navigate('/inventory')} className="text-[#00796B] text-[14px] font-medium hover:text-[#00695C] hover:underline active:opacity-70 transition-colors">View all</button>
            </div>
            <div className="flex flex-col gap-[12px]">
                {expiringItems.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-[12px] p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
                            <Leaf className="text-green-600" size={24} />
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">No expiring items!</p>
                        <p className="text-xs text-slate-400">Great job managing your food.</p>
                    </div>
                ) : (
                    expiringItems.map(item => {
                        const isExpired = item.daysLeft < 0;
                        return (
                            <button
                                key={item.id}
                                className="w-full text-left bg-white dark:bg-slate-800 rounded-[12px] p-[12px] shadow-sm border border-slate-200 dark:border-slate-700 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:shadow-md active:scale-[0.99] active:bg-slate-100 dark:active:bg-slate-700 transition-all cursor-pointer" 
                                onClick={() => navigate('/inventory')}
                            >
                                <div className={`w-[48px] h-[48px] rounded-[8px] mr-[12px] flex items-center justify-center text-2xl ${isExpired ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                                    {isExpired ? '⚠️' : '🕒'}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-[16px] text-[#212121] dark:text-slate-100">{item.name}</div>
                                    <div className="flex gap-2">
                                        <span className={`${isExpired ? 'text-[#D32F2F]' : 'text-[#C2410C]'} text-[12px] font-medium`}>
                                            {isExpired ? 'Expired!' : `Expires in ${item.daysLeft} days`}
                                        </span>
                                        <span className="text-[#757575] dark:text-slate-500 text-[12px]"> • {item.quantity} {item.unit}</span>
                                    </div>
                                </div>
                                <div className={`${isExpired ? 'bg-[#D32F2F]' : 'bg-[#FFC107]'} text-${isExpired ? 'white' : '[#212121]'} text-[12px] font-medium px-[8px] py-[6px] rounded-[12px]`}>
                                    {isExpired ? 'Critical' : 'Soon'}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
          </div>

          {/* Leaderboard & Badges Stack */}
          <div className="flex flex-col gap-6">
              {/* Your Badges */}
              <div>
                <div className="flex justify-between items-baseline mb-[12px]">
                    <h3 className="font-bold text-[20px] text-[#212121] dark:text-white">Your Badges</h3>
                    <button 
                        onClick={() => navigate('/badges')}
                        className="text-[#00796B] text-[14px] font-medium hover:text-[#00695C] hover:underline active:opacity-70 transition-colors"
                    >
                        View all
                    </button>
                </div>
                <button 
                    onClick={() => navigate('/badges')}
                    className="w-full text-left bg-white dark:bg-slate-800 rounded-[16px] p-[16px] shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
                >
                    <div className="flex items-center gap-4 mb-3">
                        {earnedBadgeObjects.slice(0, 3).map(badge => (
                            <div key={badge.id} className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${badge.color}20` }}>
                                {badge.icon}
                            </div>
                        ))}
                        {earnedBadgeObjects.length === 0 && (
                            <p className="text-center font-normal text-[14px] text-[#757575] dark:text-slate-400 w-full">Start your journey to earn badges!</p>
                        )}
                        {earnedBadgeObjects.length > 3 && (
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">
                                +{earnedBadgeObjects.length - 3}
                            </div>
                        )}
                    </div>
                    
                    <p className="font-semibold text-[14px] text-[#212121] dark:text-slate-100 mt-[12px]">Level {stats.level} - {stats.xp} pts</p>
                    <div className="w-full h-[8px] bg-[#F0F4F3] dark:bg-slate-700 rounded-[8px] mt-[8px] overflow-hidden">
                        <div className="h-full bg-[#00796B] rounded-[8px] transition-all duration-1000" style={{ width: `${(stats.xp % 1000 / 1000) * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-[#757575] dark:text-slate-500 mt-2 text-right">
                        {1000 - (stats.xp % 1000)} pts to next level
                    </p>
                </button>
              </div>

              {/* Community Leaders */}
              <div>
                <h3 className="font-bold text-[20px] text-[#212121] dark:text-white">Community Leaders</h3>
                <p className="font-normal text-[13px] text-[#757575] dark:text-slate-400 mb-[16px]">This month's top contributors</p>
                
                <div className="flex flex-col gap-[16px]">
                    {[
                        { rank: 1, name: 'Sarah M.', meals: '234 meals', points: '12,450', bg: '#FFEB3B', initial: 'S', badge: '#FFD700' },
                        { rank: 2, name: 'Green Grocers', meals: '198 meals', points: '11,200', bg: '#BDBDBD', initial: 'G', badge: '#C0C0C0' },
                        { rank: 3, name: 'FreshMart', meals: '167 meals', points: '9,800', bg: '#8D6E63', initial: 'F', badge: '#CD7F32' },
                    ].map((leader, i) => (
                        <div key={i} className="flex items-center hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl -mx-2 transition-colors cursor-default" tabIndex={0}>
                            <div className="w-[24px] font-bold text-[16px] text-[#212121] dark:text-slate-300">{leader.rank}</div>
                            <div className="relative w-[40px] h-[40px] rounded-full flex items-center justify-center mr-[12px] shadow-sm" style={{ backgroundColor: leader.bg }}>
                                <span className="text-white font-bold text-[16px] drop-shadow-sm">{leader.initial}</span>
                                {leader.badge && (
                                    <div className="absolute bottom-0 right-0 w-[14px] h-[14px] rounded-full border border-white" style={{ backgroundColor: leader.badge }}></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-[14px] text-[#212121] dark:text-slate-100">{leader.name}</div>
                                <div className="font-normal text-[12px] text-[#757575] dark:text-slate-400">{leader.meals}</div>
                            </div>
                            <div className="font-bold text-[14px] text-[#00796B] text-right">{leader.points}</div>
                        </div>
                    ))}
                </div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;