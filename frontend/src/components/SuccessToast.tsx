import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { TIMEOUTS } from '../config/constants';

interface SuccessToastProps {
  show: boolean;
  onClose: () => void;
  message: string;
  duration?: number;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ show, onClose, message, duration = TIMEOUTS.SUCCESS_TOAST }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <div
      className={`fixed bottom-5 right-5 z-[200] transition-all duration-300 ease-in-out ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      {show && (
        <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-stone-200 dark:border-slate-700 p-4 w-full max-w-sm">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{message}</p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessToast;