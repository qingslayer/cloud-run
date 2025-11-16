import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { UserCircleIcon } from './icons/UserCircleIcon';
import UserMenu from './UserMenu';
import { View, Theme } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { FolderIcon } from './icons/FolderIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowBackIcon } from './icons/ArrowBackIcon';

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
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 group
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
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
  onBack,
  navigationContext,
  onNavigate
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
          onSearch(query);
          setQuery('');
        }
    }, [query, onSearch]);

    const handlePrevClick = useCallback(() => {
        if (onNavigate && navigationContext?.hasPrev) {
          onNavigate('prev');
        }
    }, [onNavigate, navigationContext?.hasPrev]);

    const handleNextClick = useCallback(() => {
        if (onNavigate && navigationContext?.hasNext) {
          onNavigate('next');
        }
    }, [onNavigate, navigationContext?.hasNext]);

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
    <header className="flex-shrink-0 sticky top-0 z-40 w-full flex justify-center px-4 py-3 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl">
      <div className="w-full max-w-4xl flex items-center h-14 px-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-full border border-stone-200/80 dark:border-slate-800 shadow-lg">

        {/* Left: Dynamic Navigation Icons */}
        <div className="flex items-center space-x-2">
            {/* Always show Home */}
            <NavItem
                icon={<HomeIcon className="w-6 h-6" />}
                label="Dashboard"
                isActive={activeView === 'dashboard' && !onBack}
                onClick={() => setView('dashboard')}
            />

            {/* If viewing a document, show back + prev/next */}
            {onBack ? (
              <>
                {/* Back button - visually distinct */}
                <NavItem
                  icon={<ArrowBackIcon className="w-6 h-6" />}
                  label="Back"
                  isActive={false}
                  onClick={onBack}
                />

                {/* Visual separator */}
                {navigationContext && onNavigate && (
                  <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
                )}

                {/* Document navigation with counter */}
                {navigationContext && onNavigate && (
                  <div className="flex items-center gap-1">
                    {/* Previous document */}
                    <button
                      onClick={handlePrevClick}
                      disabled={!navigationContext.hasPrev}
                      className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-stone-200/80 dark:hover:bg-slate-800/80 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      title="Previous document"
                      aria-label="Previous document"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>

                    {/* Counter */}
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2 min-w-[3rem] text-center">
                      {navigationContext.currentIndex + 1} / {navigationContext.total}
                    </span>

                    {/* Next document */}
                    <button
                      onClick={handleNextClick}
                      disabled={!navigationContext.hasNext}
                      className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-stone-200/80 dark:hover:bg-slate-800/80 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      title="Next document"
                      aria-label="Next document"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Otherwise show All Records */
              <NavItem
                  icon={<FolderIcon className="w-6 h-6" />}
                  label="All Records"
                  isActive={activeView === 'records'}
                  onClick={() => setView('records')}
              />
            )}
        </div>

        {/* Center: Search Bar (Always visible) */}
        <form onSubmit={handleSubmit} className="flex-grow flex items-center justify-center px-2 sm:px-4 h-full">
            <div className="flex items-center w-full max-w-md relative">
              <button
                type="button"
                onClick={toggleRightPanel}
                title="AI Assistant"
                aria-label="Toggle AI Assistant panel"
                className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <SparklesIcon className="w-6 h-6" />
              </button>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search records or ask a question..."
                aria-label="Search records or ask a question"
                className="flex-grow pl-2 pr-10 py-3 bg-transparent text-left text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:rounded-lg"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
        </form>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center space-x-3">
            {uploadButton}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    aria-label="User menu"
                    aria-expanded={isMenuOpen}
                    aria-haspopup="true"
                    className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt={`${currentUser.displayName || 'User'} profile`} className="w-8 h-8 rounded-full" />
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
