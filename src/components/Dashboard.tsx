import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, FoodItem, User } from '../types';
import { Leaf, DollarSign, Share2, Utensils, Bell, ArrowUp, Plus, Camera, Heart, BookOpen, MapPin, BarChart3, ChevronRight, HeartHandshake, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ALL_BADGES } from './Badges';
import { MOCK_LEADERBOARD_DATA } from './Leaderboard';

interface DashboardProps {
  user: User | null;
  stats: UserStats;
  inventory: FoodItem[];
}

const MOTIVATIONAL_QUOTES = [
  "Every meal saved is a win for the planet. 🌍",
  "Small steps lead to big environmental changes. 🌱",
  "Food rescue: The easiest way to fight climate change. 🥗",
  "Your table, zero waste, infinite impact. ✨",
  "Love food, hate waste. 💚",
  "Sustainability starts in your kitchen. 🏠",
  "Reduce, reuse, and rescue. 🔄",
  "Waste-free living looks great on you! 😎",
  "You are making a real difference today. 🌟",
  "Nature thanks you for every bite saved. 🌲"
];

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
  const { theme } = useTheme();

  // States for interactive feedback and motivation
  const [appreciationMsg, setAppreciationMsg] = useState<string | null>(null);
  const [msgStyles, setMsgStyles] = useState({
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    headerText: 'text-primary'
  });
  const [showConfetti, setShowConfetti] = useState(false);

  // Motivational Quote State
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);

  // Interval for motivational quotes (Every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setQuoteFade(true);
      }, 500); // Small delay for transition
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const expiringItems = inventory
    .filter(item => item.status === 'active')
    .map(item => {
      const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return { ...item, daysLeft: days };
    })
    .filter(item => item.daysLeft <= 4)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

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

    const styles: Record<string, any> = {
      'Meals Saved': { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800', headerText: 'text-emerald-600' },
      'CO₂ Prevented': { text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-100 dark:border-green-800', headerText: 'text-green-600' },
      'Money Saved': { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800', headerText: 'text-amber-600' },
      'Donations Made': { text: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'border-pink-100 dark:border-pink-800', headerText: 'text-pink-600' }
    };

    setAppreciationMsg(messages[label]);
    setMsgStyles(styles[label]);
    setShowConfetti(true);

    setTimeout(() => {
      setAppreciationMsg(null);
      setShowConfetti(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col pt-[20px] md:pt-0 px-[16px] md:px-0 gap-[24px] animate-fade-in relative pb-10">
      {showConfetti && <ConfettiRain />}

      {/* Header Summary Section */}
      <div className="glass-card flex flex-wrap justify-between items-start gap-6 mt-2 relative overflow-hidden bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/80">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex-1 min-w-[280px] relative z-10">
          <h2 className="font-bold text-[32px] md:text-[40px] text-slate-900 dark:text-white leading-[1.2] mb-3">
            Welcome back,<br />
            <span className="text-primary">{user?.name.split(' ')[0] || 'Chef'} 👋</span>
          </h2>

          {/* Motivational Quote */}
          <div className={`flex items-center gap-3 font-semibold transition-all duration-500 transform ${quoteFade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} ${msgStyles.headerText} text-base md:text-lg leading-snug`}>
            <Sparkles size={20} fill="currentColor" className="animate-pulse shrink-0" />
            <span>{MOTIVATIONAL_QUOTES[quoteIndex]}</span>
          </div>

          {/* Interactive Appreciation Bubble */}
          <div className={`h-10 mt-4 transition-all duration-500 transform ${appreciationMsg ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
            <div className={`inline-flex items-center gap-2 ${msgStyles.bg} ${msgStyles.text} px-4 py-2 rounded-2xl text-xs font-bold shadow-sm border ${msgStyles.border}`}>
              <Sparkles size={14} className="animate-pulse" />
              {appreciationMsg}
            </div>
          </div>
        </div>

        <button
          onClick={() => handleQuickAction('/inventory', { action: 'add' })}
          className="btn-primary min-w-[160px] md:min-w-[180px] h-[60px] text-lg rounded-2xl group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
          <Plus size={24} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
          Add Food
        </button>
      </div>

      {/* Stat Cards - Improved Visuals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Utensils, label: 'Meals Saved', value: stats.mealsSaved, color: 'bg-teal-500', prefix: '', suffix: '', decimals: 0 },
          { icon: Leaf, label: 'CO₂ Prevented', value: stats.co2Saved, color: 'bg-emerald-500', prefix: '', suffix: ' kg', decimals: 1 },
          { icon: DollarSign, label: 'Money Saved', value: stats.moneySaved, color: 'bg-amber-500', prefix: '₹', suffix: '', decimals: 0 },
          { icon: HeartHandshake, label: 'Donations', value: stats.donationsCompleted, color: 'bg-pink-500', prefix: '', suffix: '', decimals: 0 }
        ].map((stat, i) => (
          <button
            key={i}
            onClick={() => handleStatClick(stat.label)}
            className="glass-card text-left p-5 min-h-[140px] flex flex-col justify-between group overflow-hidden relative border-l-4 border-l-transparent hover:border-l-primary"
          >
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} className={`${stat.color.replace('bg-', 'text-')}`} />
              </div>
              {/* Background Decor */}
              <stat.icon size={80} className={`absolute -bottom-4 -right-4 opacity-5 pointer-events-none ${stat.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform duration-500`} />
            </div>
            <div>
              <div className="font-extrabold text-3xl text-slate-900 dark:text-white mt-3 tracking-tight">
                <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
              </div>
              <div className="font-medium text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">{stat.label}</div>
            </div>
          </button>
        ))}
      </div>

      <div>
        <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { icon: Plus, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', title: 'Add Item', path: '/inventory', state: { action: 'add' } },
            { icon: Camera, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800', title: 'Scan Food', path: '/inventory', state: { action: 'scan' } },
            { icon: Heart, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', title: 'Donate', path: '/donate' },
            { icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', title: 'Recipes', path: '/recipes' },
            { icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', title: 'NGO Map', path: '/ngos' },
            { icon: BarChart3, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', title: 'Analytics', path: '/analytics' }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => handleQuickAction(action.path, action.state)}
              className={`
                        ${action.bg} ${action.border} border 
                        relative h-[120px] rounded-3xl flex flex-col items-center justify-center p-2 
                        transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95 group
                    `}
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-950 shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-md transition-all duration-300 group-hover:rotate-3">
                <action.icon size={26} strokeWidth={2.5} className={action.color} />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-tight text-center">
                {action.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <div className="glass-card flex flex-col">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full" />
              Expiring Soon
            </h3>
            <button onClick={() => navigate('/inventory')} className="text-primary text-sm font-bold hover:underline hover:scale-105 transition-transform active:scale-95">View inventory</button>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {expiringItems.length === 0 ? (
              <div className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center p-8 opacity-60">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-2xl">🌱</div>
                <p className="font-bold text-slate-500">Your inventory is fresh!</p>
              </div>
            ) : (
              expiringItems.map(item => {
                const isExpired = item.daysLeft < 0;
                return (
                  <button
                    key={item.id}
                    className="w-full text-left bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group active:scale-[0.99] flex items-center"
                    onClick={() => navigate('/inventory')}
                  >
                    <div className={`w-12 h-12 rounded-xl mr-4 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm ${isExpired ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      {isExpired ? '⚠️' : '🕒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">{item.name}</div>
                      <span className={`${isExpired ? 'text-red-600' : 'text-amber-600'} text-xs font-bold uppercase tracking-wider`}>
                        {isExpired ? 'Expired!' : `Expires in ${item.daysLeft} days`}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-primary" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="glass-card flex flex-col">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-yellow-400 rounded-full" />
              Top Savers
            </h3>
            <Sparkles className="text-yellow-400" size={20} fill="currentColor" />
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {leaderboardWidgetData.map((leader, i) => (
              <div key={i} className={`flex items-center p-3 rounded-2xl transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 group border ${leader.isCurrentUser ? 'bg-primary/5 border-primary/20' : 'border-transparent'}`}>
                <div className={`w-8 h-8 flex items-center justify-center font-black text-sm rounded-lg ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-800' : i === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-500'}`}>
                  {leader.rank}
                </div>

                <div className="mx-4 relative">
                  <img src={leader.avatar} alt={leader.name} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800 shadow-sm" />
                  {leader.isCurrentUser && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">{leader.name} {leader.isCurrentUser && '(You)'}</div>
                  <div className="text-xs text-slate-500 font-medium">{leader.meals} meals saved</div>
                </div>

                <div className="font-black text-sm text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                  {leader.xp.toLocaleString()} XP
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/leaderboard')} className="w-full mt-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group">
            View Full Rankings <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
