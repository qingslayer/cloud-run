import React from 'react';
// Fix: The 'Theme' type is exported from '../types', not '../App'.
import { Theme } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ComputerDesktopIcon } from './icons/ComputerDesktopIcon';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const options: { name: Theme; icon: React.ReactNode }[] = [
    { name: 'light', icon: <SunIcon className="w-5 h-5" /> },
    { name: 'dark', icon: <MoonIcon className="w-5 h-5" /> },
    { name: 'system', icon: <ComputerDesktopIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex items-center justify-center p-1 bg-stone-200/60 dark:bg-slate-800/60 rounded-xl">
      {options.map((option) => (
        <button
          key={option.name}
          onClick={() => setTheme(option.name)}
          className={`relative flex-1 flex items-center justify-center h-8 rounded-lg transition-colors duration-200 text-slate-500 dark:text-slate-400 capitalize text-sm font-medium
            ${theme === option.name ? 'text-slate-800 dark:text-slate-200' : 'hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {theme === option.name && (
            <span
              className="absolute inset-0 z-0 bg-white dark:bg-slate-700/50 rounded-lg shadow-sm"
              style={{ transition: 'transform 0.3s' }}
            ></span>
          )}
          <span className="relative z-10">{option.icon}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;