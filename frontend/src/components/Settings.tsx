import React, { useState } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { Theme } from '../types';
import { NoSymbolIcon } from './icons/NoSymbolIcon';
import { PencilIcon } from './icons/PencilIcon';
import { updateUserProfile } from '../services/userService';

interface SettingsProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onDeleteAllRecords: () => void;
    currentUser: User | null;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, onDeleteAllRecords, currentUser }) => {
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editedDisplayName, setEditedDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

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

    // Get user display info
    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
    const email = currentUser?.email || '';

    const handleStartEdit = () => {
        setEditedDisplayName(displayName);
        setIsEditingProfile(true);
        setSaveError(null);
        setSaveSuccess(false);
    };

    const handleCancelEdit = () => {
        setIsEditingProfile(false);
        setEditedDisplayName('');
        setSaveError(null);
        setSaveSuccess(false);
    };

    const handleSaveProfile = async () => {
        if (!currentUser || !editedDisplayName.trim()) {
            setSaveError('Display name cannot be empty');
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            // Update Firebase Auth profile
            await updateProfile(currentUser, {
                displayName: editedDisplayName.trim()
            });

            // Update Firestore user profile
            await updateUserProfile(currentUser.uid, {
                displayName: editedDisplayName.trim()
            });

            setSaveSuccess(true);
            setIsEditingProfile(false);

            // Hide success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setSaveError(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                     <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white truncate">Settings</h1>
                    {/* Profile Settings */}
                    <Card>
                        <CardHeader title="Profile" subtitle="This is how your information is displayed." />
                        <div className="p-5 space-y-4">
                            <div className="flex items-center space-x-4">
                                {currentUser?.photoURL ? (
                                    <img src={currentUser.photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-2xl">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    {!isEditingProfile ? (
                                        <>
                                            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</h4>
                                            <p className="text-slate-500 dark:text-slate-400 truncate">{email}</p>
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={editedDisplayName}
                                                onChange={(e) => setEditedDisplayName(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                placeholder="Display name"
                                            />
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{email}</p>
                                        </div>
                                    )}
                                </div>
                                {!isEditingProfile && (
                                    <button
                                        onClick={handleStartEdit}
                                        className="p-2 rounded-full text-slate-500 hover:text-teal-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                                        title="Edit profile"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            {/* Edit mode buttons */}
                            {isEditingProfile && (
                                <div className="flex items-center justify-end space-x-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving || !editedDisplayName.trim()}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}

                            {/* Success message */}
                            {saveSuccess && (
                                <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                                    <p className="text-sm text-teal-700 dark:text-teal-300">Profile updated successfully!</p>
                                </div>
                            )}

                            {/* Error message */}
                            {saveError && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Data Management */}
                    <Card>
                         <CardHeader title="Data Management" subtitle="Manage your records in bulk." />
                         <div className="p-5">
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