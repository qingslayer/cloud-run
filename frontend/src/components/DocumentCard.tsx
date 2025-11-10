import React from 'react';
import { DocumentFile } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { categoryInfoMap } from '../utils/category-info';
import { generateSnippet, getDocumentDate } from '../utils/health-helpers';
import { formatRelativeTime } from '../utils/formatters';

interface DocumentCardProps {
  document: DocumentFile;
  onRemove: (id: string) => void;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  isViewed?: boolean;  // Track if document has been viewed
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onRemove, onView, onEdit, isViewed = false }) => {
  const categoryInfo = categoryInfoMap[document.category];

  if (!categoryInfo && import.meta.env.DEV) {
    console.warn(`Unknown category "${document.category}" for document ${document.id}. Using 'Other' as fallback.`);
  }

  const { icon: CategoryIcon, color, lightColor } = categoryInfo || categoryInfoMap['Other'];
  const hasAiAnalysis = !!document.aiAnalysis;
  const isProcessing = !hasAiAnalysis; // Processing if no AI analysis yet
  const snippet = generateSnippet(document);

  // Check if document is new (uploaded within last 24 hours) AND not yet viewed
  const isNew = (() => {
    if (isViewed) return false;  // Don't show NEW badge if already viewed

    const now = new Date();
    const uploadDate = new Date(document.uploadDate);
    const diffTime = now.getTime() - uploadDate.getTime();
    const diffHours = diffTime / (1000 * 3600);
    return diffHours <= 24;
  })();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isButton = target.closest('button');
    const isLink = target.closest('a');

    if (isButton || isLink) {
        return;
    }

    // Prevent opening documents that are still processing
    if (isProcessing) {
      return;
    }

    onView(document.id);
  };

  // If processing, show a processing variant of the standard card
  if (isProcessing) {
    return (
      <div className={`group relative flex items-center p-4 rounded-2xl shadow-sm transition-all duration-300 border
          bg-white dark:bg-slate-800/50
          border-amber-400/40 dark:border-amber-600/40
          cursor-not-allowed`}
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${lightColor} animate-pulse`}>
          <CategoryIcon className={`w-6 h-6 ${color}`} />
        </div>

        <div className="flex-grow min-w-0">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate" title={document.displayName}>
            {document.displayName}
          </p>
          <div className="flex items-center space-x-2 mt-0.5">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse animation-delay-200" />
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse animation-delay-400" />
            </div>
            <span className="text-sm text-amber-600 dark:text-amber-400">
              Analyzing...
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          <div className="w-5 h-5 rounded-full border-2 border-amber-300 dark:border-amber-600 border-t-amber-500 dark:border-t-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-center p-4 rounded-2xl shadow-sm transition-all duration-300 border
          bg-white dark:bg-slate-800/50
          border-stone-200/80 dark:border-slate-800
          cursor-pointer hover:shadow-md hover:border-teal-400/80 dark:hover:border-teal-500/80 hover:bg-stone-50/50 dark:hover:bg-slate-800 hover:scale-[1.01]`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${lightColor}`}>
        <CategoryIcon className={`w-6 h-6 ${color}`} />
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate" title={document.displayName}>{document.displayName}</p>
          {isNew && (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 rounded-full">
              NEW
            </span>
          )}
        </div>
        {snippet && (
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400 truncate">
            {snippet}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 ml-auto flex items-center space-x-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 hidden md:block whitespace-nowrap">
          {formatRelativeTime(getDocumentDate(document) || new Date(document.uploadDate))}
        </p>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(document.id); }}
                    title="Edit"
                    className="p-2 rounded-full text-slate-500 hover:text-teal-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                    <PencilIcon className="h-5 w-5" />
                </button>
            )}
            <a
                href={document.downloadUrl}
                download={document.filename}
                title="Download"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-full text-slate-500 hover:text-teal-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <DownloadIcon className="h-5 w-5" />
            </a>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(document.id); }}
                title="Delete"
                className="p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;