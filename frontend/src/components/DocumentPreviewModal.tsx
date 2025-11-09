import React, { useEffect, useState } from 'react';
import { DocumentFile } from '../types';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';

interface DocumentPreviewModalProps {
  document: DocumentFile;
  onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

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
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
              {document.displayName || document.filename}
            </h3>

            <div className="flex items-center space-x-4">
              {/* Zoom controls for images only */}
              {document.fileType?.startsWith('image/') && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                    disabled={zoomLevel <= 0.5}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Zoom out"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-300 min-w-[4rem] text-center font-medium">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}
                    disabled={zoomLevel >= 3}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Zoom in"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    disabled={zoomLevel === 1}
                    className="px-2 py-1 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Reset zoom"
                  >
                    Reset
                  </button>
                </div>
              )}

              <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 dark:text-gray-500 bg-white/10 hover:bg-white/20 hover:text-red-500 transition-colors"
                  aria-label="Close document preview"
              >
                  <XIcon className="h-5 w-5" />
              </button>
            </div>
        </div>
        <div className="flex-grow mt-3 overflow-auto rounded-lg">
             {document.downloadUrl ? (
                document.fileType?.startsWith('image/') ? (
                  <img
                    src={document.downloadUrl}
                    alt={document.displayName || document.filename}
                    className="mx-auto object-contain transition-transform duration-200"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center'
                    }}
                  />
              ) : (
                  <embed
                    src={document.downloadUrl}
                    type={document.fileType || 'application/pdf'}
                    className="w-full h-full"
                  />
              )
             ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white">No preview available.</p>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;