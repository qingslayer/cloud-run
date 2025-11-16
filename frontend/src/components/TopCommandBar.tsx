import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { UserCircleIcon } from './icons/UserCircleIcon';
import UserMenu from './UserMenu';
import { View, Theme } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface NavigationContext {
  currentIndex: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface TopCommandBarProps {
  activeView: View;
  setView: (view: View) => void;
  onSearch: (query: string) => void;
  onLogout: () => void;
  toggleRightPanel: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentUser: User | null;
  uploadButton?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
  navigationContext?: NavigationContext;
  onNavigate?: (direction: 'prev' | 'next') => void;
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

const TopCommandBar: React.FC<TopCommandBarProps> = ({
  activeView,
  setView,
  onSearch,
  onLogout,
  toggleRightPanel,
  theme,
  setTheme,
  currentUser,
  uploadButton,
  breadcrumbs = [],
  onBack,
  navigationContext,
  onNavigate
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const showBreadcrumbs = breadcrumbs.length > 0;

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

        {/* Center: Breadcrumbs & Navigation or Search */}
        <div className="flex-grow flex items-center justify-center px-4 h-full min-w-0">
          {showBreadcrumbs ? (
            <div className="flex items-center gap-2 min-w-0">
              {/* Back button */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex-shrink-0 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  title="Back"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
              )}

              {/* Breadcrumb path */}
              <nav className="flex items-center gap-1.5 min-w-0 text-sm">
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <svg className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                    {item.onClick ? (
                      <button
                        onClick={item.onClick}
                        className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium truncate max-w-[150px]"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px]">
                        {item.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              {/* Document navigation (prev/next) */}
              {navigationContext && onNavigate && (
                <div className="flex items-center gap-1 ml-3 pl-3 border-l border-slate-300 dark:border-slate-700">
                  <button
                    onClick={() => onNavigate('prev')}
                    disabled={!navigationContext.hasPrev}
                    className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Previous document (←)"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  <span className="text-xs text-slate-500 dark:text-slate-400 px-1.5 whitespace-nowrap">
                    {navigationContext.currentIndex + 1}/{navigationContext.total}
                  </span>

                  <button
                    onClick={() => onNavigate('next')}
                    disabled={!navigationContext.hasNext}
                    className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Next document (→)"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )}

              {/* AI Assistant button */}
              <button
                type="button"
                onClick={toggleRightPanel}
                title="AI Assistant"
                className="flex-shrink-0 ml-2 flex items-center justify-center w-9 h-9 rounded-full text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
              >
                <SparklesIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center w-full max-w-md">
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
            </form>
          )}
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center space-x-3">
            {uploadButton}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors overflow-hidden"
                >
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                    ) : (
                        <UserCircleIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                    )}
                </button>
                {isMenuOpen && (
                    <UserMenu
                        onLogout={onLogout}
                        setView={setView}
                        onClose={() => setIsMenuOpen(false)}
                        theme={theme}
                        setTheme={setTheme}
                        currentUser={currentUser}
                    />
                )}
            </div>
        </div>

      </div>
    </header>
  );
};

export default TopCommandBar;
