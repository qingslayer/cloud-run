import React from 'react';
import { DocumentFile } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { categoryInfoMap } from '../utils/category-info';
import { generateSnippet } from '../utils/health-helpers';
import { formatRelativeTime } from '../utils/formatters';

interface DocumentCardProps {
  document: DocumentFile;
  onRemove: (id: string) => void;
  onView: (id: string) => void;
}

const ProcessingSpinner: React.FC = () => (
    <div className="flex items-center space-x-1">
        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
)

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onRemove, onView }) => {
  const { icon: CategoryIcon, color, lightColor } = categoryInfoMap[document.category];
  const isProcessing = document.status === 'processing';
  const isForReview = document.status === 'review';
  const hasError = document.status === 'error';
  const snippet = generateSnippet(document);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isButton = target.closest('button');
    const isLink = target.closest('a');

    if (isButton || isLink) {
        return;
    }
    if (!isProcessing) {
      onView(document.id);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative flex items-center p-4 rounded-2xl shadow-sm transition-all duration-300 border
          bg-white dark:bg-slate-800/50
          border-stone-200/80 dark:border-slate-800
          ${isProcessing ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-md hover:border-teal-400/80 dark:hover:border-teal-500/80 hover:bg-stone-50/50 dark:hover:bg-slate-800'}
          ${isForReview ? 'border-amber-500/60' : ''}`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${lightColor}`}>
        <CategoryIcon className={`w-6 h-6 ${color}`} />
      </div>

      <div className="flex-grow min-w-0">
        <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate" title={document.title}>{document.title}</p>
        {snippet && (
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400 truncate">
            {snippet}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 ml-4 flex items-center space-x-4">
        {isProcessing && (
            <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-sky-500/10">
                <ProcessingSpinner />
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Processing...</span>
            </div>
        )}
        {hasError && (
            <div className="px-2 py-1 rounded-md bg-red-500/10">
              <p className="text-xs font-semibold text-red-500 dark:text-red-400">Failed</p>
            </div>
        )}
        {isForReview && (
            <button onClick={() => onView(document.id)} className="px-3 py-1.5 text-sm font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20">
                Review & Save
            </button>
        )}
        {!isProcessing && !isForReview && !hasError && (
            <>
                <p className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">{formatRelativeTime(document.uploadDate)}</p>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={document.base64Data} download={document.name} title="Download" onClick={(e) => e.stopPropagation()} className="p-2 rounded-full text-slate-500 hover:text-teal-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors">
                        <DownloadIcon className="h-5 w-5" />
                    </a>
                    <button onClick={(e) => { e.stopPropagation(); onRemove(document.id); }} title="Delete" className="p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;