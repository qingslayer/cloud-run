import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EmptyDashboard } from './illustrations/EmptyDashboard';

interface WelcomeModalProps {
  onClose: () => void;
  onStartTour?: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onStartTour }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-8 text-white text-center">
          <EmptyDashboard className="max-w-xs mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl font-bold mb-2">Welcome to HealthVault</h2>
          <p className="text-teal-50 text-lg">Your AI-powered personal health record manager</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
            Here's what you can do:
          </h3>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                <UploadIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Upload Medical Documents
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload lab results, prescriptions, imaging reports, and more. AI automatically extracts and organizes the information.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Review & Edit
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Verify AI-extracted data, make corrections, and add personal notes. Your health records, your control.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                <SearchIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Search & Chat
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Ask questions like "What was my cholesterol last year?" AI finds and explains your health data instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
              <SparklesIcon className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold">Pro tip:</strong> Start by uploading a recent lab result or prescription. The AI will show you what it can do!
              </span>
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
            <div className="grid grid-cols-2 gap-2">
              <div><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Cmd+K</kbd> Search</div>
              <div><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Cmd+U</kbd> Upload</div>
              <div><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">ESC</kbd> Close panels</div>
              <div><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">←→</kbd> Navigate docs</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-colors font-semibold shadow-md"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;