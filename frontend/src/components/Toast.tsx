import React, { useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { AlertCircleIcon } from './icons/AlertCircleIcon';
import { InfoIcon } from './icons/InfoIcon';
import { TIMEOUTS } from '../config/constants';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = TIMEOUTS.TOAST_DEFAULT, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertCircleIcon className="h-6 w-6 text-amber-500" />;
      case 'info':
        return <InfoIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-amber-500';
      case 'info':
        return 'border-l-blue-500';
    }
  };

  return (
    <div className={`flex items-start space-x-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-stone-200 dark:border-slate-700 border-l-4 ${getBorderColor()} p-4 w-full max-w-sm animate-slide-in-right`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">{message}</p>
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={() => onClose(id)}
          className="p-1 rounded-full text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors"
          aria-label="Close notification"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
