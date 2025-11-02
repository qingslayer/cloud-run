import React from 'react';

export const FriendlyAssistant: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g fill="none" strokeWidth="2" stroke="currentColor">
      {/* Background Glow */}
      <circle cx="150" cy="100" r="80" className="text-indigo-100 dark:text-indigo-900/50" fill="currentColor" />
      
      {/* Robot Head */}
      <g className="text-slate-700 dark:text-slate-300">
        <rect x="110" y="60" width="80" height="60" rx="20" fill="currentColor" />
        <rect x="125" y="120" width="50" height="10" rx="5" fill="currentColor" />
      </g>

      {/* Eyes */}
      <g className="text-white dark:text-slate-900">
        <circle cx="135" cy="85" r="8" fill="currentColor" />
        <circle cx="165" cy="85" r="8" fill="currentColor" />
      </g>
      
      {/* Antenna */}
      <line x1="150" y1="60" x2="150" y2="40" className="text-slate-500 dark:text-slate-400" strokeLinecap="round" />
      <circle cx="150" cy="35" r="5" className="text-fuchsia-500" fill="currentColor" />
      
      {/* Floating Sparkles */}
      <g className="text-amber-400">
          <path d="M80 80 L85 90 L90 80 L85 70 Z" />
          <path d="M210 120 L215 130 L220 120 L215 110 Z" transform="scale(0.8)"/>
      </g>

      {/* Floating Chat Bubble */}
      <g transform="translate(40 130)">
        <path d="M0 20 C0 8.95 8.95 0 20 0 H60 C71.05 0 80 8.95 80 20 V30 C80 41.05 71.05 50 60 50 H20 C8.95 50 0 41.05 0 30 Z" className="text-white dark:text-slate-700" fill="currentColor" />
        <path d="M0 20 C0 8.95 8.95 0 20 0 H60 C71.05 0 80 8.95 80 20 V30 C80 41.05 71.05 50 60 50 H20 C8.95 50 0 41.05 0 30 Z" className="text-slate-300 dark:text-slate-600" />
        <circle cx="20" cy="25" r="3" className="text-slate-400" fill="currentColor" />
        <circle cx="35" cy="25" r="3" className="text-slate-400" fill="currentColor" />
        <circle cx="50" cy="25" r="3" className="text-slate-400" fill="currentColor" />
      </g>
    </g>
  </svg>
);