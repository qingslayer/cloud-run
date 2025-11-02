import React, { useEffect } from 'react';
import { DocumentFile } from '../types';
import { XIcon } from './icons/XIcon';

interface DocumentPreviewModalProps {
  document: DocumentFile;
  onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl h-[90vh] bg-white/5 dark:bg-black/20 rounded-2xl border border-white/10 shadow-2xl flex flex-col p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{document.name}</h3>
            <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 dark:text-gray-500 bg-white/10 hover:bg-white/20 hover:text-red-500 transition-colors"
                aria-label="Close document preview"
            >
                <XIcon className="h-5 w-5" />
            </button>
        </div>
        <div className="flex-grow mt-3 overflow-auto rounded-lg">
             {document.type.startsWith('image/') ? (
                <img src={document.base64Data} alt={document.name} className="max-h-full max-w-full mx-auto object-contain" />
            ) : (
                <embed src={document.base64Data} type="application/pdf" className="w-full h-full" />
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;