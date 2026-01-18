import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, ChefHat, Heart, MapPin, Leaf, Moon, Sun, User as UserIcon, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { User } from '../../types';

interface SidebarProps {
    user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/inventory', icon: Package, label: 'Inventory' },
        { path: '/recipes', icon: ChefHat, label: 'Recipes' },
        { path: '/donate', icon: Heart, label: 'Donate' },
        { path: '/ngos', icon: MapPin, label: 'NGOs' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-[260px] h-screen fixed left-0 top-0 z-50 transition-all duration-300 border-r border-slate-200/60 dark:border-slate-800/60 glass">
            {/* Brand Header */}
            <div className="p-8 flex items-center gap-4 mb-4 group cursor-pointer" onClick={() => window.location.hash = '#/'}>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Leaf size={24} fill="white" className="drop-shadow-sm" />
                </div>
                <div>
                    <h1 className="font-bold text-2xl tracking-tight text-slate-800 dark:text-slate-100 leading-none group-hover:text-primary transition-colors">SaveBite</h1>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5 opacity-80 group-hover:opacity-100 transition-all">Zero Waste</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`
                relative flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden
                ${isActive
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                                }
              `}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_12px_rgba(5,150,105,0.4)]" />
                            )}
                            <item.icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`transition-all duration-300 z-10 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110'}`}
                            />
                            <span className="z-10">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 mx-4 mb-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm w-full mb-3 group transition-all"
                >
                    {theme === 'light'
                        ? <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500" />
                        : <Sun size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    }
                    <span className="text-sm font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                </button>

                <NavLink to="/profile" className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-sm group">
                    <div className="relative">
                        <img
                            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                            alt="Profile"
                            className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white dark:border-slate-700 shadow-sm group-hover:border-primary transition-all"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                            {user?.name || 'Guest User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">View Profile</p>
                    </div>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
