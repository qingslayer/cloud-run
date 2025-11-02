import React from 'react';

export const WelcomeIllustration: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g fill="none" strokeWidth="2">
      {/* Background shape */}
      <rect x="0" y="0" width="300" height="200" rx="20" className="text-indigo-100 dark:text-indigo-500/10" fill="currentColor" />

      {/* Document stack */}
      <g transform="translate(150 100) rotate(-10)">
        <rect x="-70" y="-50" width="140" height="100" rx="10" className="text-white dark:text-slate-700" fill="currentColor" />
        <rect x="-70" y="-50" width="140" height="100" rx="10" className="text-slate-200 dark:text-slate-600" stroke="currentColor"/>
      </g>
      <g transform="translate(150 100) rotate(5)">
        <rect x="-70" y="-50" width="140" height="100" rx="10" className="text-white dark:text-slate-700" fill="currentColor" />
        <rect x="-70" y="-50" width="140" height="100" rx="10" className="text-slate-200 dark:text-slate-600" stroke="currentColor"/>
      </g>
      <g transform="translate(150 100)">
        <rect x="-70" y="-50" width="140" height="100" rx="10" className="text-white dark:text-slate-800" fill="currentColor" />
        <rect x="-70" y="-50" width="140" height="100" rx="10" className="text-slate-300 dark:text-slate-600" stroke="currentColor"/>
        <line x1="-55" y1="-30" x2="0" y2="-30" className="stroke-current text-indigo-400" strokeWidth="3" />
        <line x1="-55" y1="-15" x2="30" y2="-15" className="stroke-current text-slate-400" />
        <line x1="-55" y1="0" x2="40" y2="0" className="stroke-current text-slate-400" />
        <line x1="-55" y1="15" x2="35" y2="15" className="stroke-current text-slate-400" />
      </g>

      {/* Heart/Health Icon */}
      <g transform="translate(30 30)">
        <path d="M40 20 C 40 0, 80 0, 80 20 C 80 40, 60 50, 40 70 C 20 50, 0 40, 0 20 C 0 0, 40 0, 40 20 Z" className="text-rose-500" fill="currentColor" />
      </g>
      
      {/* Lock Icon */}
      <g transform="translate(200 110)" className="text-emerald-500">
        <rect x="0" y="10" width="50" height="40" rx="10" fill="currentColor" />
        <path d="M25 10 V-5 C25 -15 0 -15 0 -5 V10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </g>
  </svg>
);