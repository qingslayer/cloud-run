import React, { useEffect } from 'react';
import { DocumentFile } from '../types';
import DocumentUploader from './DocumentUploader';
import { XIcon } from './icons/XIcon';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesChange: (files: DocumentFile[]) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentFile>) => void;
  onError?: (message: string) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFilesChange,
  onUpdateDocument,
  onError
}) => {

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleUploadStart = () => {
    // Auto-close modal after file selection
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-stone-50 dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-2xl flex flex-col p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 dark:text-gray-500 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 hover:text-red-500 transition-colors"
            aria-label="Close upload modal"
        >
            <XIcon className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Upload New Record</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Drop your file below. The AI will automatically suggest a title and category for you to review.</p>

        <DocumentUploader
          onFilesChange={onFilesChange}
          onUpdateDocument={onUpdateDocument}
          onUploadStart={handleUploadStart}
          onError={onError}
        />
      </div>
    </div>
  );
};

export default UploadModal;