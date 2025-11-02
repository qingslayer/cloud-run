import React from 'react';
import { LogOutIcon } from './icons/LogOutIcon';
import { View, Theme } from '../types';
import ThemeToggle from './ThemeToggle';

// Fix: Define CogIcon locally to resolve the module import error without adding a new file.
const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

interface UserMenuProps {
  onLogout: () => void;
  setView: (view: View) => void;
  onClose: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onLogout, setView, onClose, theme, setTheme }) => {
  
  const handleSettingsClick = () => {
    setView('settings');
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-lg animate-fade-in-fast z-50">
        <div className="p-2">
            <div className="p-3">
                 <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Demo User</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">demo.user@healthvault.app</p>
            </div>
             <hr className="border-stone-200 dark:border-slate-800"/>
             <div className="p-3">
                <ThemeToggle theme={theme} setTheme={setTheme} />
             </div>
             <hr className="border-stone-200 dark:border-slate-800"/>
            <div className="p-1">
                 <button onClick={handleSettingsClick} className="w-full text-left flex items-center space-x-3 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors">
                    <CogIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium">Settings</span>
                </button>
                 <button onClick={onLogout} className="w-full text-left flex items-center space-x-3 p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-colors">
                    <LogOutIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default UserMenu;