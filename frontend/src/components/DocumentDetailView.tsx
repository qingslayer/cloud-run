import React, { useState } from 'react';
import { DocumentFile, DocumentCategory } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import StructuredDataDisplay from './StructuredDataDisplay';
import { formatBytes, formatRelativeTime } from '../utils/formatters';
import { EyeIcon } from './icons/EyeIcon';
import DocumentPreviewModal from './DocumentPreviewModal';
import { CalendarIcon } from './icons/CalendarIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { ClipboardNotesIcon } from './icons/ClipboardNotesIcon';
import { categoryInfoMap } from '../utils/category-info';

interface DocumentDetailViewProps {
  document: DocumentFile;
  onClose: () => void;
}

const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({ document, onClose }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { color, lightColor } = categoryInfoMap[document.category];

  return (
    <>
    <div className="absolute inset-0 bg-stone-50 dark:bg-[#0B1120] z-50 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-2 mb-4">
        <button onClick={onClose} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">Back to Timeline</span>
        </button>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow overflow-y-auto pr-2">
        <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <div className="mb-8">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${lightColor} ${color}`}>
                  {document.category}
              </span>
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-3">{document.displayName}</h1>
            </div>
            
            {/* Document Overview & Key Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metadata & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Document Details</h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-start">
                                <CalendarIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">Upload Date</p>
                                    <p className="text-slate-500 dark:text-slate-400">{new Date(document.uploadDate).toLocaleDateString()} ({formatRelativeTime(new Date(document.uploadDate))})</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full flex items-center justify-center px-4 py-3 bg-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition-all transform hover:scale-105"
                    >
                        <EyeIcon className="w-5 h-5 mr-2" />
                        View Original Document
                    </button>
                </div>

                {/* Right Column: Key Information */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl shadow-sm">
                        <div className="p-5">
                            <StructuredDataDisplay data={document.aiAnalysis?.structuredData} category={document.category as DocumentCategory} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
    {isModalOpen && <DocumentPreviewModal document={document} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default DocumentDetailView;