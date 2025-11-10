import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import DocumentUploader from './DocumentUploader';
import { DocumentFile } from '../types';

interface GlobalUploadButtonProps {
  onFilesChange: (files: DocumentFile[]) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentFile>) => void;
  onError?: (message: string) => void;
  documents?: DocumentFile[];  // Pass documents for tracking status
  onSelectDocument?: (id: string) => void;  // Navigate to document
}

const GlobalUploadButton: React.FC<GlobalUploadButtonProps> = ({
  onFilesChange,
  onUpdateDocument,
  onError,
  documents = [],
  onSelectDocument
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleUploadComplete = () => {
    // Don't auto-close - let user see progress until documents are complete
  };

  const handleSelectDocument = (id: string) => {
    if (onSelectDocument) {
      onSelectDocument(id);
      setIsOpen(false); // Close modal after navigating
    }
  };

  return (
    <div className="relative">
      {/* Upload Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center px-4 py-2 bg-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition-all transform hover:scale-105 ${
          isOpen ? 'scale-105 bg-teal-700' : ''
        }`}
        aria-label="Upload documents"
      >
        <UploadIcon className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">Upload</span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-slate-800 z-50 animate-fade-in"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Upload Documents
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Drop files or click to browse
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors"
                aria-label="Close upload panel"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Uploader Component */}
            <DocumentUploader
              onFilesChange={onFilesChange}
              onUpdateDocument={onUpdateDocument}
              onUploadComplete={handleUploadComplete}
              onError={onError}
              compact={true}
              uploadedDocuments={documents}
              onSelectDocument={handleSelectDocument}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalUploadButton;