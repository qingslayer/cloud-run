import React from 'react';

export const EmptyDashboard: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g fill="none" stroke="currentColor" strokeWidth="2">
      {/* Background shapes */}
      <circle cx="50" cy="50" r="20" className="text-indigo-100 dark:text-indigo-900/50" />
      <rect x="230" y="130" width="40" height="40" rx="10" className="text-emerald-100 dark:text-emerald-900/50" />
      <path d="M150,20 L160,40 L180,50 L160,60 L150,80 L140,60 L120,50 L140,40 Z" className="text-amber-100 dark:text-amber-900/50" />

      {/* Main folder icon */}
      <g className="text-slate-300 dark:text-slate-700">
        <path d="M40 180 H260 V80 H140 L120 60 H40 Z" fill="currentColor" />
        <path d="M40 180 H260 V80 H140 L120 60 H40 Z" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      
      {/* Document icon */}
      <g transform="translate(100 90) rotate(5)">
        <rect x="0" y="0" width="100" height="70" rx="5" className="text-white dark:text-slate-800" fill="currentColor" />
        <rect x="0" y="0" width="100" height="70" rx="5" stroke="currentColor" />
        <line x1="10" y1="15" x2="60" y2="15" className="stroke-current text-indigo-400" />
        <line x1="10" y1="25" x2="80" y2="25" className="stroke-current text-slate-400" />
        <line x1="10" y1="35" x2="70" y2="35" className="stroke-current text-slate-400" />
        <line x1="10" y1="45" x2="85" y2="45" className="stroke-current text-slate-400" />
        <rect x="70" y="10" width="20" height="10" rx="3" className="text-emerald-300" fill="currentColor" />
      </g>

      {/* Plus icon */}
      <circle cx="230" cy="70" r="25" className="text-indigo-500" fill="currentColor" />
      <g stroke="#FFF" strokeWidth="3" strokeLinecap="round">
        <line x1="230" y1="60" x2="230" y2="80" />
        <line x1="220" y1="70" x2="240" y2="70" />
      </g>
    </g>
  </svg>
);