import React, { useState, useEffect, useRef } from 'react';
import { UserCircleIcon } from './icons/UserCircleIcon';
import UserMenu from './UserMenu';
import { View, Theme } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface TopCommandBarProps {
  activeView: View;
  setView: (view: View) => void;
  onSearch: (query: string) => void;
  onLogout: () => void;
  toggleRightPanel: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  uploadButton?: React.ReactNode;
}

// Defined at the top level for stability and to prevent re-renders
const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 group ${
                isActive
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800/60'
            }`}
        >
            {icon}
        </button>
    );
};

const TopCommandBar: React.FC<TopCommandBarProps> = ({ activeView, setView, onSearch, onLogout, toggleRightPanel, theme, setTheme, uploadButton }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
          onSearch(query);
          setQuery('');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4">
      <div className="w-full flex items-center h-16 px-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-full border border-stone-200/80 dark:border-slate-800 shadow-lg">
        
        {/* Left: Navigation */}
        <div className="flex items-center space-x-2">
            <NavItem 
                icon={<HomeIcon className="w-6 h-6" />}
                label="Dashboard"
                isActive={activeView === 'dashboard'}
                onClick={() => setView('dashboard')}
            />
            <NavItem 
                icon={<CollectionIcon className="w-6 h-6" />}
                label="My Records"
                isActive={activeView === 'records'}
                onClick={() => setView('records')}
            />
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSubmit} className="flex-grow flex items-center justify-center px-4 h-full">
            <div className="flex items-center w-full max-w-md">
              <button
                type="button"
                onClick={toggleRightPanel}
                title="AI Assistant"
                className="flex items-center justify-center w-11 h-11 rounded-full text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors shrink-0"
              >
                <SparklesIcon className="w-6 h-6" />
              </button>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search records or ask a question..."
                className="flex-grow pl-2 pr-4 py-3 bg-transparent text-left text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
            </div>
        </form>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center space-x-3">
            {uploadButton}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                    <UserCircleIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                </button>
                {isMenuOpen && (
                    <UserMenu 
                        onLogout={onLogout} 
                        setView={setView}
                        onClose={() => setIsMenuOpen(false)}
                        theme={theme}
                        setTheme={setTheme}
                    />
                )}
            </div>
        </div>

      </div>
    </header>
  );
};

export default TopCommandBar;
