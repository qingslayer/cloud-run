import React from 'react';
import { DocumentCategory } from '../types';
import { BeakerIcon } from '../components/icons/BeakerIcon';
import { PillIcon } from '../components/icons/PillIcon';
import { FilmIcon } from '../components/icons/FilmIcon';
import { ClipboardNotesIcon } from '../components/icons/ClipboardNotesIcon';
import { SyringeIcon } from '../components/icons/SyringeIcon';
import { CollectionIcon } from '../components/icons/CollectionIcon';

// Fix: Added 'gradient' property to the type and each category to support its usage in Dashboard.tsx for CategoryTile styling.
export const categoryInfoMap: { [key in DocumentCategory]: { 
    icon: React.FC<any>, 
    color: string, 
    glow: string,
    lightColor: string,
    borderColor: string,
    gradient: string;
} } = {
    'Lab Results': { 
        icon: BeakerIcon, 
        color: 'text-sky-600 dark:text-sky-400', 
        glow: 'shadow-sky-500/20',
        lightColor: 'bg-sky-100 dark:bg-sky-900/30',
        borderColor: 'border-sky-500',
        gradient: 'bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/50 dark:to-slate-900/50'
    },
    'Prescriptions': { 
        icon: PillIcon, 
        color: 'text-emerald-600 dark:text-emerald-400', 
        glow: 'shadow-emerald-500/20',
        lightColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        borderColor: 'border-emerald-500',
        gradient: 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/50 dark:to-slate-900/50'
    },
    'Imaging Reports': { 
        icon: FilmIcon, 
        color: 'text-indigo-600 dark:text-indigo-400', 
        glow: 'shadow-indigo-500/20',
        lightColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        borderColor: 'border-indigo-500',
        gradient: 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/50 dark:to-slate-900/50'
    },
    "Doctor's Notes": { 
        icon: ClipboardNotesIcon, 
        color: 'text-amber-600 dark:text-amber-400', 
        glow: 'shadow-amber-500/20',
        lightColor: 'bg-amber-100 dark:bg-amber-900/30',
        borderColor: 'border-amber-500',
        gradient: 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/50 dark:to-slate-900/50'
    },
    'Vaccination Records': { 
        icon: SyringeIcon, 
        color: 'text-rose-600 dark:text-rose-400', 
        glow: 'shadow-rose-500/20',
        lightColor: 'bg-rose-100 dark:bg-rose-900/30',
        borderColor: 'border-rose-500',
        gradient: 'bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/50 dark:to-slate-900/50'
    },
    'Other': { 
        icon: CollectionIcon, 
        color: 'text-slate-600 dark:text-slate-400', 
        glow: 'shadow-slate-500/20',
        lightColor: 'bg-slate-200 dark:bg-slate-700/50',
        borderColor: 'border-slate-500',
        gradient: 'bg-gradient-to-br from-slate-100 to-white dark:from-slate-800/50 dark:to-slate-900/50'
    },
};