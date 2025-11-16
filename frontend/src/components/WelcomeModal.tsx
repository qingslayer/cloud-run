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
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          {/* Header with illustration */}
          <div className="text-center mb-12">
            <EmptyDashboard className="max-w-sm mx-auto mb-8 opacity-90" />
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Welcome to HealthVault
            </h1>
            <p className="text-xl text-slate-300">
              Your secure, AI-powered personal health record manager. Upload documents, get instant insights
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
                <UploadIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Upload Medical Documents
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Upload lab results, prescriptions, imaging reports, and more. AI automatically extracts and organizes the information.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Review & Edit
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Verify AI-extracted data, make corrections, and add personal notes. Your health records, your control.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-sky-500/30">
                <SearchIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Search & Chat
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Ask questions like "What was my cholesterol last year?" AI finds and explains your health data instantly.
              </p>
            </div>
          </div>

          {/* Pro tip */}
          <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <SparklesIcon className="w-6 h-6 text-teal-300 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-semibold mb-1">Pro tip:</p>
                <p className="text-slate-200">
                  Start by uploading a recent lab result or prescription. The AI will show you what it can do!
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
            <p className="text-white font-semibold mb-4">Keyboard Shortcuts:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded font-mono text-xs">Cmd+K</kbd>
                <span className="text-slate-300">Search</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded font-mono text-xs">Cmd+U</kbd>
                <span className="text-slate-300">Upload</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded font-mono text-xs">ESC</kbd>
                <span className="text-slate-300">Close panels</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded font-mono text-xs">←→</kbd>
                <span className="text-slate-300">Navigate docs</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-10 py-4 rounded-xl text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all font-semibold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/50 hover:scale-105 transform"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;