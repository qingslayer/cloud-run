import React from 'react';

export const EmptyRecords: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g fill="none" strokeWidth="2" stroke="currentColor">
      {/* Background elements */}
      <path d="M 20,80 Q 40,60 60,80 T 100,80" strokeDasharray="4 4" className="text-stone-200 dark:text-slate-700"/>
      <circle cx="250" cy="50" r="30" className="text-indigo-100 dark:text-indigo-900/50" />
      <rect x="40" y="150" width="50" height="50" rx="10" className="text-emerald-100 dark:text-emerald-900/50" transform="rotate(-15 40 150)"/>
      
      {/* Main clipboard and paper */}
      <g className="text-slate-300 dark:text-slate-600">
        <rect x="70" y="30" width="160" height="150" rx="10" fill="currentColor"/>
        <path d="M120,30 V15 C120,8 128,2 135,2 H165 C172,2 180,8 180,15 V30" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      
      <rect x="85" y="45" width="130" height="120" rx="5" fill="#FFF" className="dark:fill-slate-800" />
      
      {/* Lines on paper */}
      <g stroke="currentColor" className="text-slate-400 dark:text-slate-500">
        <line x1="100" y1="60" x2="200" y2="60" />
        <line x1="100" y1="75" x2="180" y2="75" />
        <line x1="100" y1="90" x2="200" y2="90" />
        <line x1="100" y1="105" x2="170" y2="105" />
        <line x1="100" y1="120" x2="200" y2="120" />
      </g>
      
      {/* Magnifying glass */}
      <g className="text-indigo-500 dark:text-indigo-400" transform="translate(160 110) rotate(30)">
        <circle cx="0" cy="0" r="25" fill="none" stroke="currentColor" strokeWidth="3" />
        <line x1="20" y1="20" x2="40" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);