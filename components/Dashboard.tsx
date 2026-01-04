
import React from 'react';
import { UserStats, FoodItem, User } from '../types';
import { Leaf, DollarSign, Share2, Utensils, Bell, Menu, ArrowUp, Plus, Camera, Heart, BookOpen, MapPin, BarChart3, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User | null;
  stats: UserStats;
  inventory: FoodItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, stats, inventory }) => {
  const navigate = useNavigate();

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

  return (
    <div className="flex flex-col pt-[20px] px-[16px] gap-[24px] animate-in fade-in duration-500">
      
      {/* 2) Header and Welcome Area */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-[12px]">
            <div className="w-[48px] h-[48px] bg-[#1CAE9E] rounded-full flex items-center justify-center shadow-md shadow-teal-100">
                <Leaf size={24} color="white" fill="white" />
            </div>
            <h1 className="font-semibold text-[20px] text-[#212121]">FoodSaver</h1>
        </div>
        <div className="flex items-center gap-[16px]">
            <button className="active:scale-90 transition-transform"><Menu size={24} color="#757575" /></button>
            <div className="relative active:scale-90 transition-transform">
                <Bell size={24} color="#757575" />
                {expiringItems.length > 0 && (
                    <div className="absolute top-[-6px] right-[-6px] w-[18px] h-[18px] bg-[#F44336] rounded-full border-[2px] border-white flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{expiringItems.length}</span>
                    </div>
                )}
            </div>
        </div>
      </header>

      <div className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <h2 className="font-bold text-[32px] text-[#212121] leading-[1.2] mb-[8px]">
                Welcome back,<br />{user?.name.split(' ')[0] || 'Chef'} 👋
            </h2>
            <p className="font-normal text-[13px] text-[#757575]">
                You've saved {stats.mealsSaved} meals this month!
            </p>
          </div>
          <button 
            onClick={() => navigate('/inventory')}
            className="bg-[#1CAE9E] text-white font-semibold text-[16px] px-[20px] py-[12px] rounded-[12px] shadow-[0_2px_6px_rgba(28,160,150,0.12)] active:scale-95 transition-transform min-h-[48px] hover:bg-[#179c8d]"
            aria-label="Add food"
          >
            Add Food
          </button>
      </div>

      {/* 3) Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-[16px]">
        {/* Card 1: Meals Saved */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col justify-between min-h-[110px] hover:shadow-md transition-shadow">
            <div className="w-[48px] h-[48px] rounded-full bg-[#1CAE9E] flex items-center justify-center">
                <Utensils size={24} color="white" strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] mt-[12px]">{stats.mealsSaved}</div>
                <div className="font-normal text-[14px] text-[#757575]">Meals Saved</div>
                <div className="flex items-center gap-1 mt-1 text-[#1CAE9E] text-[12px]">
                    <ArrowUp size={12} strokeWidth={2} />
                    <span>+12% this week</span>
                </div>
            </div>
        </div>

        {/* Card 2: CO2 Prevented */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col justify-between min-h-[110px] hover:shadow-md transition-shadow">
            <div className="w-[48px] h-[48px] rounded-full bg-[#1CAE9E] flex items-center justify-center">
                <Leaf size={24} color="white" strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] mt-[12px]">{stats.co2Saved} kg</div>
                <div className="font-normal text-[14px] text-[#757575]">CO₂ Prevented</div>
                <div className="flex items-center gap-1 mt-1 text-[#1CAE9E] text-[12px]">
                    <ArrowUp size={12} strokeWidth={2} />
                    <span>+12% this week</span>
                </div>
            </div>
        </div>

         {/* Card 3: Money Saved */}
         <div className="bg-white rounded-[16px] p-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col justify-between min-h-[110px] hover:shadow-md transition-shadow">
            <div className="w-[48px] h-[48px] rounded-full bg-[#FF9800] flex items-center justify-center">
                <DollarSign size={24} color="white" strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] mt-[12px]">${stats.moneySaved}</div>
                <div className="font-normal text-[14px] text-[#757575]">Money Saved</div>
                <div className="flex items-center gap-1 mt-1 text-[#1CAE9E] text-[12px]">
                    <ArrowUp size={12} strokeWidth={2} />
                    <span>+12% this week</span>
                </div>
            </div>
        </div>

         {/* Card 4: Food Rescued */}
         <div className="bg-white rounded-[16px] p-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col justify-between min-h-[110px] hover:shadow-md transition-shadow">
            <div className="w-[48px] h-[48px] rounded-full bg-[#2196F3] flex items-center justify-center">
                <Share2 size={24} color="white" strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] mt-[12px]">0 kg</div>
                <div className="font-normal text-[14px] text-[#757575]">Food Rescued</div>
                <div className="flex items-center gap-1 mt-1 text-[#1CAE9E] text-[12px]">
                    <ArrowUp size={12} strokeWidth={2} />
                    <span>+12% this week</span>
                </div>
            </div>
        </div>
      </div>

      {/* 4) Quick Actions */}
      <div>
        <h3 className="font-bold text-[20px] text-[#212121] mb-[12px]">Quick Actions</h3>
        <div className="flex gap-[12px] overflow-x-auto pb-[10px] px-[4px] -mx-[4px] scrollbar-hide">
            {[
                { icon: Plus, bg: '#1CAE9E', title: 'Add Item', desc: 'Track new food', path: '/inventory' },
                { icon: Camera, bg: '#1CAE9E', title: 'Scan Food', desc: 'AI recognition', path: '/inventory' },
                { icon: Heart, bg: '#F44336', title: 'Donate', desc: 'Help others', path: '/donate' },
                { icon: BookOpen, bg: '#FF9800', title: 'Recipes', desc: 'Use expiring food', path: '/recipes' },
                { icon: MapPin, bg: '#9C27B0', title: 'Find NGOs', desc: 'Nearby partners', path: '/ngos' },
                { icon: BarChart3, bg: '#2196F3', title: 'Analytics', desc: 'View impact', path: '/' }
            ].map((action, i) => (
                <button 
                    key={i}
                    onClick={() => navigate(action.path)}
                    className="bg-white min-w-[120px] h-[96px] rounded-[12px] p-[12px] flex flex-col items-start shadow-[0_2px_4px_rgba(0,0,0,0.1)] active:scale-95 transition-transform hover:shadow-md border border-transparent hover:border-slate-100"
                >
                    <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center mb-2 shadow-sm" style={{ backgroundColor: action.bg }}>
                        <action.icon size={24} color="white" strokeWidth={2} />
                    </div>
                    <div className="font-semibold text-[14px] text-[#212121] mt-[8px] leading-none">{action.title}</div>
                    <div className="font-normal text-[12px] text-[#757575] mt-1">{action.desc}</div>
                </button>
            ))}
        </div>
      </div>

      {/* 5) Expiring Soon */}
      <div>
        <div className="flex justify-between items-baseline mb-[12px]">
            <h3 className="font-bold text-[20px] text-[#212121]">Expiring Soon</h3>
            <button onClick={() => navigate('/inventory')} className="text-[#1CAE9E] text-[14px] font-normal hover:underline">View all</button>
        </div>
        <div className="flex flex-col gap-[12px]">
            {expiringItems.length === 0 ? (
                <div className="bg-white rounded-[12px] p-8 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                        <Leaf className="text-green-500" size={24} />
                    </div>
                    <p className="font-semibold text-slate-800">No expiring items!</p>
                    <p className="text-xs text-slate-400">Great job managing your food.</p>
                </div>
            ) : (
                expiringItems.map(item => {
                    const isExpired = item.daysLeft < 0;
                    return (
                        <div key={item.id} className="bg-white rounded-[12px] p-[12px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex items-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/inventory')}>
                            <div className={`w-[48px] h-[48px] rounded-[8px] mr-[12px] flex items-center justify-center text-2xl ${isExpired ? 'bg-red-50' : 'bg-yellow-50'}`}>
                                {isExpired ? '⚠️' : '🕒'}
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-[16px] text-[#212121]">{item.name}</div>
                                <div className="flex gap-2">
                                    <span className={`${isExpired ? 'text-[#F44336]' : 'text-[#FFB300]'} text-[12px] font-medium`}>
                                        {isExpired ? 'Expired!' : `Expires in ${item.daysLeft} days`}
                                    </span>
                                    <span className="text-[#757575] text-[12px]"> • {item.quantity} {item.unit}</span>
                                </div>
                            </div>
                            <div className={`${isExpired ? 'bg-[#F44336]' : 'bg-[#FFC107]'} text-${isExpired ? 'white' : '[#212121]'} text-[12px] font-medium px-[8px] py-[6px] rounded-[12px]`}>
                                {isExpired ? 'Critical' : 'Soon'}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* 6) Your Badges */}
      <div>
        <div className="flex justify-between items-baseline mb-[12px]">
            <h3 className="font-bold text-[20px] text-[#212121]">Your Badges</h3>
            <button className="text-[#1CAE9E] text-[14px] font-normal hover:underline">View all</button>
        </div>
        <div className="bg-white rounded-[16px] p-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
            <p className="text-center font-normal text-[14px] text-[#757575]">Start your journey to earn badges!</p>
            <p className="font-semibold text-[14px] text-[#212121] mt-[12px]">Level 1 - {stats.xp} pts - <span className="font-normal">1000 points to next level</span></p>
            <div className="w-full h-[8px] bg-[#F0F4F3] rounded-[8px] mt-[8px] overflow-hidden">
                <div className="h-full bg-[#1CAE9E] rounded-[8px] transition-all duration-1000" style={{ width: `${(stats.xp / 1000) * 100}%` }}></div>
            </div>
        </div>
      </div>

      {/* 7) Community Leaders */}
      <div>
        <h3 className="font-bold text-[20px] text-[#212121]">Community Leaders</h3>
        <p className="font-normal text-[13px] text-[#757575] mb-[16px]">This month's top contributors</p>
        
        <div className="flex flex-col gap-[16px]">
            {[
                { rank: 1, name: 'Sarah M.', meals: '234 meals contributed', points: '12,450', bg: '#FFEB3B', initial: 'S', badge: '#FFD700' },
                { rank: 2, name: 'Green Grocers', meals: '198 meals contributed', points: '11,200', bg: '#BDBDBD', initial: 'G', badge: '#C0C0C0' },
                { rank: 3, name: 'FreshMart', meals: '167 meals contributed', points: '9,800', bg: '#8D6E63', initial: 'F', badge: '#CD7F32' },
                { rank: 4, name: 'John D.', meals: '145 meals contributed', points: '8,500', bg: '#E0E0E0', initial: 'J' },
                { rank: 5, name: 'City Foods', meals: '123 meals contributed', points: '7,200', bg: '#E0E0E0', initial: 'C' }
            ].map((leader, i) => (
                <div key={i} className="flex items-center">
                    <div className="w-[24px] font-bold text-[16px] text-[#212121]">{leader.rank}</div>
                    <div className="relative w-[40px] h-[40px] rounded-full flex items-center justify-center mr-[12px] shadow-sm" style={{ backgroundColor: leader.bg }}>
                        <span className="text-white font-bold text-[16px] drop-shadow-sm">{leader.initial}</span>
                        {leader.badge && (
                            <div className="absolute bottom-0 right-0 w-[14px] h-[14px] rounded-full border border-white" style={{ backgroundColor: leader.badge }}></div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-[14px] text-[#212121]">{leader.name}</div>
                        <div className="font-normal text-[12px] text-[#757575]">{leader.meals}</div>
                    </div>
                    <div className="font-bold text-[14px] text-[#1CAE9E] text-right">{leader.points}</div>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
