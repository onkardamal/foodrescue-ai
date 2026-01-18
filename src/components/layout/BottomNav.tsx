import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, ChefHat, Heart, MapPin } from 'lucide-react';

const BottomNav: React.FC = () => {
    const location = useLocation();
    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/inventory', icon: Package, label: 'Items' },
        { path: '/recipes', icon: ChefHat, label: 'Cook' },
        { path: '/donate', icon: Heart, label: 'Donate' },
        { path: '/ngos', icon: MapPin, label: 'Map' },
    ];

    return (
        <nav className="md:hidden fixed bottom-4 left-4 right-4 h-[72px] glass rounded-3xl z-[100] flex justify-between items-center px-6 shadow-2xl shadow-slate-900/10">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className="relative flex flex-col items-center justify-center w-12 h-12 group"
                    >
                        {isActive && (
                            <div className="absolute -top-12 opacity-50 blur-xl w-8 h-8 bg-primary rounded-full animate-pulse"></div>
                        )}

                        <div
                            className={`
                transition-all duration-300 relative z-10 p-2 rounded-xl
                ${isActive
                                    ? '-translate-y-6 bg-primary text-white shadow-lg shadow-primary/30 scale-110 rotate-3'
                                    : 'text-slate-400 dark:text-slate-500 active:scale-95'
                                }
              `}
                        >
                            <item.icon
                                size={isActive ? 24 : 26}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={!isActive ? 'group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors' : ''}
                            />
                        </div>

                        <span
                            className={`
                absolute bottom-1 text-[10px] font-bold tracking-tight transition-all duration-300
                ${isActive
                                    ? 'translate-y-0 opacity-100 text-primary'
                                    : 'translate-y-2 opacity-0'
                                }
              `}
                        >
                            {item.label}
                        </span>

                        {/* Active Indicator Dot */}
                        {!isActive && (
                            <div className="absolute -bottom-2 w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default BottomNav;
