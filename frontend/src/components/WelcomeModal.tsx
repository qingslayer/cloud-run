import React from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface WelcomeModalProps {
  onClose: () => void;
  onStartTour?: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onStartTour }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex flex-col items-center gap-4">
        {/* Modal - Narrower width */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
          {/* Visual Header - More turquoise/teal */}
          <div className="relative bg-gradient-to-br from-teal-600 via-cyan-700 to-cyan-800 px-8 py-12 text-white text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-4 left-8 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-4 right-8 w-20 h-20 bg-cyan-400/20 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/40 rounded-full"></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white/40 rounded-full"></div>

            <div className="relative">
              {/* Large icon - Original gradient colors */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl mb-4 shadow-xl">
                <SparklesIcon className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-4xl font-bold mb-3 tracking-tight">
                Welcome to HealthVault
              </h2>
              <p className="text-teal-50 text-lg max-w-md mx-auto">
                Your AI-powered personal health record manager
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 pb-6">
            <div className="space-y-6 mb-6">
              {/* Upload Feature */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <UploadIcon className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-1">
                    Upload Medical Documents
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Upload lab results, prescriptions, and more. AI automatically extracts and organizes the information.
                  </p>
                </div>
              </div>

              {/* Review Feature - Transition color between teal and sky */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <CheckCircleIcon className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-1">
                    Review & Edit
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Verify AI-extracted data, make corrections, and add personal notes.
                  </p>
                </div>
              </div>

              {/* Search Feature */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <SearchIcon className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-1">
                    Search & Chat
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Ask questions like "What was my cholesterol last year?" and get instant answers.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-3">
                <ShieldCheckIcon className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <span>
                  <strong className="font-semibold">Your privacy is protected.</strong> All documents are encrypted and stored securely.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Get Started Button - Outside modal with outline style */}
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-xl text-teal-500 dark:text-teal-400 bg-transparent border-2 border-teal-500 dark:border-teal-400 hover:bg-teal-500/10 dark:hover:bg-teal-400/10 transition-all font-semibold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/50"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
