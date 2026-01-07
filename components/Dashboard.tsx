
import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, FoodItem, User } from '../types';
import { Leaf, DollarSign, Share2, Utensils, Bell, ArrowUp, Plus, Camera, Heart, BookOpen, MapPin, BarChart3, ChevronRight, HeartHandshake, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { ALL_BADGES } from './Badges';
import { MOCK_LEADERBOARD_DATA } from './Leaderboard';

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
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
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

// Internal Confetti Component
const ConfettiRain = () => (
  <div className="fixed inset-0 pointer-events-none z-[3000] overflow-hidden">
    {[...Array(60)].map((_, i) => (
      <div 
        key={i}
        className="absolute w-2 h-2 rounded-full animate-confetti-dashboard"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-5%`,
          backgroundColor: ['#00796B', '#F57C00', '#D32F2F', '#FFD700', '#EC4899'][i % 5],
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${1.5 + Math.random() * 2.5}s`
        }}
      />
    ))}
    <style>{`
      @keyframes confetti-dashboard {
        0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
        25% { transform: translateY(25vh) rotate(90deg) translateX(15px); }
        50% { transform: translateY(50vh) rotate(180deg) translateX(-15px); }
        75% { transform: translateY(75vh) rotate(270deg) translateX(10px); }
        100% { transform: translateY(110vh) rotate(360deg) translateX(0); opacity: 0; }
      }
      .animate-confetti-dashboard { animation-name: confetti-dashboard; animation-timing-function: ease-in; animation-fill-mode: forwards; }
    `}</style>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user, stats, inventory }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // States for interactive feedback
  const [appreciationMsg, setAppreciationMsg] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const expiringItems = inventory
    .filter(item => item.status === 'active')
    .map(item => {
        const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return { ...item, daysLeft: days };
    })
    .filter(item => item.daysLeft <= 4)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);
    
  const earnedBadgeObjects = ALL_BADGES.filter(b => stats.earnedBadges.includes(b.id));

  const leaderboardWidgetData = useMemo(() => {
    const currentUserEntry = {
        id: 'current-user',
        name: user?.name || 'You',
        meals: stats.mealsSaved,
        xp: stats.xp,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`,
        isCurrentUser: true,
        rank: 0
    };
    const all = [...MOCK_LEADERBOARD_DATA, currentUserEntry].sort((a, b) => b.xp - a.xp);
    const ranked = all.map((u, i) => ({ ...u, rank: i + 1 }));
    return ranked.slice(0, 3);
  }, [user, stats]);

  const handleQuickAction = (path: string, state?: any) => {
      navigate(path, { state });
  };

  const handleStatClick = (label: string) => {
    const messages: Record<string, string> = {
      'Meals Saved': "Incredible! You're nourishing the community . 🥗",
      'CO₂ Prevented': "Planet Hero! Your efforts are helping our Earth breathe easier. 🌍",
      'Money Saved': "Smart Choice! Every Rupee saved is a victory for your wallet and the world. 💰",
      'Donations Made': "Heart of Gold! Your generosity is changing lives every single day. ❤️"
    };

    setAppreciationMsg(messages[label]);
    setShowConfetti(true);

    // Auto-clear after 5 seconds
    setTimeout(() => {
      setAppreciationMsg(null);
      setShowConfetti(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col pt-[20px] md:pt-0 px-[16px] md:px-0 gap-[24px] animate-in fade-in duration-500 relative">
      {showConfetti && <ConfettiRain />}

      <header className="flex md:hidden justify-between items-center relative z-50">
        <div className="flex items-center gap-[12px]">
            <div className="w-[48px] h-[48px] bg-[#00796B] rounded-full flex items-center justify-center shadow-md shadow-teal-100 dark:shadow-teal-900/20 hover:scale-110 transition-transform cursor-pointer">
                <Leaf size={24} color="white" fill="white" />
            </div>
            <div>
              <h1 className="font-bold text-[20px] text-[#212121] dark:text-white leading-none">SaveBite</h1>
              <p className="text-[8px] text-[#757575] dark:text-slate-400 font-bold uppercase tracking-tighter mt-1">The right choice before waste</p>
            </div>
        </div>
        <div className="flex items-center gap-[12px]">
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all relative outline-none group"
                    aria-label="Notifications"
                >
                    <Bell size={24} className="text-[#757575] dark:text-slate-400 group-hover:rotate-12 transition-transform" />
                    {expiringItems.length > 0 && (
                        <div className="absolute top-[2px] right-[2px] w-[16px] h-[16px] bg-[#D32F2F] rounded-full border-[2px] border-white dark:border-slate-900 flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">{expiringItems.length}</span>
                        </div>
                    )}
                </button>

                {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
                        <div className="absolute right-0 top-full mt-2 w-[280px] bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                             <div className="p-3 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-[#212121] dark:text-white text-xs uppercase tracking-wider">Notifications</h3>
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
                                        <p className="text-sm">You're all caught up!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            <button 
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-transparent hover:scale-105 active:scale-95 transition-all"
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
          <div className="flex-1 min-w-[200px]">
            <h2 className="font-bold text-[32px] md:text-[40px] text-[#212121] dark:text-white leading-[1.2] mb-[8px]">
                Welcome back,<br />{user?.name.split(' ')[0] || 'Chef'} 👋
            </h2>
            <p className="font-normal text-[13px] md:text-[16px] text-[#757575] dark:text-slate-400">
                You've saved <AnimatedCounter value={stats.mealsSaved} /> meals this month!
            </p>
            
            {/* Animated Appreciation Message */}
            <div className={`h-8 mt-2 transition-all duration-500 transform overflow-hidden ${appreciationMsg ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
               <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-900/30 text-[#00796B] dark:text-teal-300 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-teal-100 dark:border-teal-800">
                  <Sparkles size={14} className="animate-pulse" />
                  {appreciationMsg}
               </div>
            </div>
          </div>
          <button 
            onClick={() => handleQuickAction('/inventory', { action: 'add' })}
            className="bg-[#00796B] hover:bg-[#00695C] text-white font-bold text-[16px] px-[24px] py-[14px] rounded-[22px] shadow-lg active:scale-95 hover:scale-[1.02] hover:-translate-y-0.5 transition-all min-h-[52px] whitespace-nowrap flex items-center justify-center gap-2 border-2 border-teal-600/20 group"
          >
            <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" /> Add Food
          </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
        {[
          { icon: Utensils, label: 'Meals Saved', value: stats.mealsSaved, color: 'bg-[#00796B]', prefix: '', suffix: '', decimals: 0 },
          { icon: Leaf, label: 'CO₂ Prevented', value: stats.co2Saved, color: 'bg-[#00796B]', prefix: '', suffix: ' kg', decimals: 1 },
          { icon: DollarSign, label: 'Money Saved', value: stats.moneySaved, color: 'bg-[#E65100]', prefix: '₹', suffix: '', decimals: 0 },
          { icon: HeartHandshake, label: 'Donations Made', value: stats.donationsCompleted, color: 'bg-pink-500', prefix: '', suffix: '', decimals: 0, isRescue: true }
        ].map((stat, i) => (
          <button 
            key={i} 
            onClick={() => handleStatClick(stat.label)}
            className="text-left bg-white dark:bg-slate-800 rounded-[20px] p-[16px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[120px] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative active:scale-[0.98]"
          >
            <div className={`w-[48px] h-[48px] rounded-full ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <stat.icon size={24} color="white" />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] dark:text-white mt-[12px]">
                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                {stat.isRescue ? (
                  <div className="relative min-h-[22px] mt-1 overflow-hidden">
                    {/* Normal Label */}
                    <div className="transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-4">
                      <div className="font-normal text-[14px] text-[#757575] dark:text-slate-400 truncate">{stat.label}</div>
                    </div>
                    {/* Appreciation Msg on Hover Tooltip inside card */}
                    <div className="absolute inset-0 transition-all duration-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 flex items-center">
                      <div className="text-[10px] sm:text-[11px] text-pink-600 dark:text-pink-400 font-bold leading-tight line-clamp-1 w-full">
                        You're making a difference! ❤️
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-normal text-[14px] text-[#757575] dark:text-slate-400 mt-1">{stat.label}</div>
                )}
            </div>
          </button>
        ))}
      </div>

      <div>
        <h3 className="font-bold text-[20px] text-[#212121] dark:text-white mb-[16px]">Quick Actions</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-[12px]">
            {[
                { icon: Plus, color: '#00796B', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', title: 'Add Item', path: '/inventory', state: { action: 'add' } },
                { icon: Camera, color: '#0288D1', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800', title: 'Scan Food', path: '/inventory', state: { action: 'scan' } },
                { icon: Heart, color: '#D32F2F', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', title: 'Donate', path: '/donate' },
                { icon: BookOpen, color: '#E65100', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', title: 'Recipes', path: '/recipes' },
                { icon: MapPin, color: '#7B1FA2', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', title: 'Find NGOs', path: '/ngos' },
                { icon: BarChart3, color: '#455A64', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', title: 'Analytics', path: '/analytics' }
            ].map((action, i) => (
                <button 
                    key={i}
                    onClick={() => handleQuickAction(action.path, action.state)}
                    className={`${action.bg} ${action.border} relative h-[110px] rounded-[24px] flex flex-col items-center justify-center p-2 transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95 group border`}
                >
                    <div className="w-[48px] h-[48px] rounded-[18px] bg-white dark:bg-slate-950 shadow-sm flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                        <action.icon size={24} strokeWidth={2.5} style={{ color: action.color }} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-tight text-center">
                        {action.title}
                    </span>
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-baseline mb-[12px]">
                <h3 className="font-bold text-[20px] text-[#212121] dark:text-white">Expiring Soon</h3>
                <button onClick={() => navigate('/inventory')} className="text-[#00796B] text-[14px] font-medium hover:underline hover:scale-105 transition-transform active:scale-95">View all</button>
            </div>
            <div className="flex flex-col gap-[12px]">
                {expiringItems.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-[12px] p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">No expiring items!</p>
                    </div>
                ) : (
                    expiringItems.map(item => {
                        const isExpired = item.daysLeft < 0;
                        return (
                            <button
                                key={item.id}
                                className="w-full text-left bg-white dark:bg-slate-800 rounded-[12px] p-[12px] shadow-sm border border-slate-200 dark:border-slate-700 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md hover:-translate-x-1 transition-all group active:scale-[0.99]" 
                                onClick={() => navigate('/inventory')}
                            >
                                <div className={`w-[48px] h-[48px] rounded-[8px] mr-[12px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${isExpired ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                                    {isExpired ? '⚠️' : '🕒'}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-[16px] text-[#212121] dark:text-slate-100">{item.name}</div>
                                    <span className={`${isExpired ? 'text-[#D32F2F]' : 'text-[#C2410C]'} text-[12px] font-medium`}>
                                        {isExpired ? 'Expired!' : `Expires in ${item.daysLeft} days`}
                                    </span>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        );
                    })
                )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between items-baseline mb-[12px]">
                    <h3 className="font-bold text-[20px] text-[#212121] dark:text-white">Your Badges</h3>
                </div>
                <button 
                    onClick={() => navigate('/badges')}
                    className="w-full text-left bg-white dark:bg-slate-800 rounded-[16px] p-[16px] shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer active:scale-[0.99]"
                >
                    <div className="flex items-center gap-4 mb-3">
                        {earnedBadgeObjects.slice(0, 3).map(badge => (
                            <div key={badge.id} className="w-10 h-10 rounded-full flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-inner" style={{ backgroundColor: `${badge.color}20` }}>
                                {badge.icon}
                            </div>
                        ))}
                        {earnedBadgeObjects.length > 3 && <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">+{earnedBadgeObjects.length - 3}</div>}
                    </div>
                    <div className="w-full h-[8px] bg-[#F0F4F3] dark:bg-slate-700 rounded-[8px] mt-[8px] overflow-hidden">
                        <div className="h-full bg-[#00796B] rounded-[8px] group-hover:opacity-80 transition-opacity" style={{ width: `${(stats.xp % 1000 / 1000) * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-[#757575] dark:text-slate-500 mt-2 text-right">Level {stats.level} • {stats.xp} pts</p>
                </button>
              </div>

              <div>
                <h3 className="font-bold text-[20px] text-[#212121] dark:text-white">Community Leaders</h3>
                <div className="flex flex-col gap-[12px] mt-4">
                    {leaderboardWidgetData.map((leader, i) => (
                        <div key={i} className={`flex items-center p-2 rounded-xl transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md hover:scale-[1.02] group ${leader.isCurrentUser ? 'bg-[#00796B]/10 border border-[#00796B]/20' : ''}`}>
                            <div className="w-[24px] font-bold text-[14px] text-[#757575] text-center">{leader.rank}</div>
                            <div className="relative group-hover:scale-110 transition-transform">
                              <img src={leader.avatar} alt={leader.name} className="w-[32px] h-[32px] rounded-full mx-[8px] bg-slate-200 border border-slate-100 dark:border-slate-700" />
                              {leader.rank === 1 && <div className="absolute -top-1 -right-1 text-[10px]">👑</div>}
                            </div>
                            <div className="flex-1 font-bold text-[14px] dark:text-white group-hover:text-[#00796B] transition-colors">{leader.name}</div>
                            <div className="font-bold text-[14px] text-[#00796B]">{leader.xp.toLocaleString()}</div>
                        </div>
                    ))}
                    <button onClick={() => navigate('/leaderboard')} className="text-center text-sm font-bold text-[#00796B] mt-2 flex items-center justify-center gap-1 hover:gap-3 transition-all hover:underline active:scale-95">View Ranking <ChevronRight size={16} /></button>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
