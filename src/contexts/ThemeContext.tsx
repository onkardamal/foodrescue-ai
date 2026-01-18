import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeContextType, Theme } from '../types';

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem('theme');
            return (saved === 'dark' || saved === 'light') ? saved : 'light';
        } catch (error) {
            console.error('Error reading theme from localStorage:', error);
            return 'light';
        }
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
