import React, { useState } from 'react';
import { User, UserStats } from '../types';
import { ArrowLeft, User as UserIcon, Settings, Bell, Shield, HelpCircle, LogOut, Moon, Sun, ChevronRight, Award, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';

interface ProfileProps {
  user: User | null;
  stats: UserStats;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, stats, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  if (!user) return null;

  const handleBack = () => {
    navigate(-1);
  };

  const MenuRow = ({ icon: Icon, label, onClick, value, danger = false }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${danger ? 'text-red-500' : 'text-[#212121] dark:text-white'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-900/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
          <Icon size={20} className={danger ? 'text-red-500' : 'text-[#757575] dark:text-slate-400'} />
        </div>
        <span className="font-medium text-sm md:text-base">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-[#757575] dark:text-slate-400">{value}</span>}
        {!danger && <ChevronRight size={18} className="text-[#BDBDBD]" />}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 pb-24 md:pb-8 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="pt-4 px-4 pb-4 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-sm mb-4 flex items-center gap-3">
        <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            type="button"
            aria-label="Back"
        >
            <ArrowLeft size={24} className="text-[#212121] dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-[#212121] dark:text-white">My Profile</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {/* User Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#00796B]/20 to-transparent"></div>
             
             <div className="relative mb-4">
                <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 shadow-lg bg-slate-200"
                />
                <button 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#00796B] rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-sm"
                  aria-label="Edit Profile Picture"
                >
                    <Settings size={14} />
                </button>
             </div>
             
             <h2 className="text-xl font-bold text-[#212121] dark:text-white mb-1">{user.name}</h2>
             <p className="text-sm text-[#757575] dark:text-slate-400 mb-4">{user.email}</p>
             
             <div className="flex gap-3">
                 <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-2">
                    <Award size={16} className="text-amber-600" />
                    <span className="text-sm font-bold text-[#212121] dark:text-white">Lvl {stats.level}</span>
                 </div>
                 <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-2">
                    <Flame size={16} className="text-orange-600" />
                    <span className="text-sm font-bold text-[#212121] dark:text-white">{stats.streakDays} Day Streak</span>
                 </div>
             </div>
        </div>

        {/* Settings Group 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
            <MenuRow 
                icon={theme === 'light' ? Moon : Sun} 
                label="Appearance" 
                value={theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                onClick={toggleTheme}
            />
            <MenuRow 
                icon={Bell} 
                label="Notifications" 
                value={notifications ? "On" : "Off"}
                onClick={() => setNotifications(!notifications)} 
            />
            <MenuRow 
                icon={Shield} 
                label="Privacy & Security" 
                onClick={() => alert("Privacy & Security module is under development.")} 
            />
        </div>

        {/* Settings Group 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
             <MenuRow 
                icon={Award} 
                label="My Badges" 
                onClick={() => navigate('/badges')} 
            />
            <MenuRow 
                icon={HelpCircle} 
                label="Help & Support" 
                onClick={() => {}} 
            />
        </div>

        {/* Logout */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
            <MenuRow 
                icon={LogOut} 
                label="Log Out" 
                danger
                onClick={onLogout} 
            />
        </div>
        
        <p className="text-center text-xs text-[#9E9E9E] dark:text-slate-600 pt-4">
            Version 1.0.0 • EcoTable Platform
        </p>
      </div>
    </div>
  );
};

export default Profile;