import React from 'react';
import { Theme } from '../types';
import ThemeToggle from './ThemeToggle';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { NoSymbolIcon } from './icons/NoSymbolIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface SettingsProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onDeleteAllRecords: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, onDeleteAllRecords }) => {

    const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
        <div className={`bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl shadow-sm ${className}`}>
            {children}
        </div>
    );

    const CardHeader: React.FC<{title: string, subtitle: string}> = ({ title, subtitle }) => (
        <div className="p-5 border-b border-stone-200 dark:border-slate-700/80">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
    );

    return (
        <div className="h-full pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                     <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white truncate">Settings</h1>
                    {/* Profile Settings */}
                    <Card>
                        <CardHeader title="Profile" subtitle="This is how your information is displayed." />
                        <div className="p-5 flex items-center space-x-4">
                            <UserCircleIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                            <div>
                                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">Demo User</h4>
                                <p className="text-slate-500 dark:text-slate-400">demo.user@healthvault.app</p>
                            </div>
                        </div>
                    </Card>

                    {/* Appearance Settings */}
                    <Card>
                        <CardHeader title="Appearance" subtitle="Customize the look and feel of the app." />
                        <div className="p-5 flex items-center justify-between">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Theme</p>
                            <ThemeToggle theme={theme} setTheme={setTheme} />
                        </div>
                    </Card>
                    
                    {/* Data Management */}
                    <Card>
                         <CardHeader title="Data Management" subtitle="Manage your records in bulk." />
                         <div className="p-5 space-y-3">
                            <button className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-stone-200/80 dark:bg-slate-700/50 hover:bg-stone-300/80 dark:hover:bg-slate-700 transition-colors">
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                <span>Export All Data</span>
                            </button>
                             <button onClick={onDeleteAllRecords} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                                <NoSymbolIcon className="w-5 h-5" />
                                <span>Delete All Records</span>
                            </button>
                         </div>
                    </Card>

                    {/* About */}
                     <Card>
                        <CardHeader title="About" subtitle="Information about this application." />
                        <div className="p-5 text-sm text-slate-500 dark:text-slate-400">
                            <p><span className="font-semibold text-slate-700 dark:text-slate-300">Health Vault</span> Version 1.0.0</p>
                            <p>Your secure and intelligent space for health records.</p>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default Settings;