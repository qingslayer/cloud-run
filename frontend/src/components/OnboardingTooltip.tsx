import React, { useEffect, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface OnboardingTooltipProps {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onDismiss: (id: string) => void;
  targetRef?: React.RefObject<HTMLElement>;
}

const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  id,
  title,
  description,
  position = 'bottom',
  onDismiss,
  targetRef,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2',
    bottom: 'bottom-full left-1/2 -translate-x-1/2',
    left: 'left-full top-1/2 -translate-y-1/2',
    right: 'right-full top-1/2 -translate-y-1/2',
  };

  const arrowBorderClasses = {
    top: 'border-t-teal-500/30',
    bottom: 'border-b-teal-500/30',
    left: 'border-l-teal-500/30',
    right: 'border-r-teal-500/30',
  };

  return (
    <div
      ref={tooltipRef}
      className={`absolute z-50 ${positionClasses[position]} animate-in fade-in-0 slide-in-from-bottom-2 duration-500`}
    >
      {/* Subtle arrow with glassmorphic effect */}
      <div className={`absolute w-0 h-0 border-[6px] border-transparent ${arrowClasses[position]} ${arrowBorderClasses[position]}`} />

      {/* Glassmorphic Tooltip Content - Improved sizing */}
      <div className="relative bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-800/95 dark:to-slate-900/90 backdrop-blur-xl border border-teal-200/50 dark:border-teal-500/30 rounded-2xl shadow-2xl shadow-teal-500/10 p-6 w-80">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/40 to-cyan-50/20 dark:from-teal-900/20 dark:to-cyan-900/10 rounded-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative">
          <div className="flex items-start gap-3 mb-4">
            {/* Icon with animated glow */}
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 animate-pulse">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-2">{title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
            </div>

            {/* Close button */}
            <button
              onClick={() => onDismiss(id)}
              className="flex-shrink-0 p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-all duration-200 group"
              aria-label="Dismiss tooltip"
            >
              <XIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
            </button>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              onClick={() => onDismiss(id)}
              className="text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-6 py-2.5 rounded-xl shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTooltip;