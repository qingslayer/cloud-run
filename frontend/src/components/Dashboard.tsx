import React, { useMemo, useState } from 'react';
import { DocumentFile, DocumentCategory, getDocumentProcessingStatus } from '../types';
import { formatRelativeTime } from '../utils/formatters';
import { categoryInfoMap } from '../utils/category-info';
import { EmptyDashboard } from './illustrations/EmptyDashboard';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ClockIcon } from './icons/ClockIcon';
import LoadingSpinner from './LoadingSpinner';


interface DashboardProps {
  documents: DocumentFile[];
  onNavigateToRecords: (category: DocumentCategory) => void;
  onSelectDocument: (id: string) => void;
  isLoading?: boolean;
}

const ALL_CATEGORIES: DocumentCategory[] = ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other'];

const CategoryTile: React.FC<{ category: DocumentCategory; count: number; onClick: () => void }> = ({ category, count, onClick }) => {
    const { icon: Icon, color, lightColor, gradient } = categoryInfoMap[category];

    return (
        <button
            onClick={onClick}
            className={`group relative text-left w-full h-full flex flex-col justify-between p-5 rounded-3xl shadow-sm transition-all duration-200 overflow-hidden border
            ${gradient}
            border-stone-200/80 dark:border-slate-800
            hover:shadow-md hover:border-teal-400/60 dark:hover:border-teal-500/60`}
        >
            <div>
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${lightColor}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <p className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">{category}</p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {count} record{count !== 1 ? 's' : ''}
            </p>
        </button>
    )
};

const RecentDocumentItem: React.FC<{ document: DocumentFile, onSelect: (id: string) => void }> = ({ document, onSelect }) => {
    const { icon: CategoryIcon, color, lightColor } = categoryInfoMap[document.category];
    return (
        <li>
          <button
            onClick={() => onSelect(document.id)}
            className="w-full text-left flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-stone-100/60 dark:hover:bg-slate-800/40 transition-colors duration-150"
          >
            <div className="flex items-center min-w-0">
                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg mr-3 ${lightColor}`}>
                    <CategoryIcon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{document.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{document.category}</p>
                </div>
            </div>
            <p className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 ml-4">{formatRelativeTime(document.uploadDate)}</p>
          </button>
        </li>
    );
}


const Dashboard: React.FC<DashboardProps> = ({ documents, onNavigateToRecords, onSelectDocument, isLoading = false }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if leaving the main container
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDraggingOver(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        // Trigger the global upload button
        const uploadButton = document.querySelector('[aria-label="Upload documents"]') as HTMLButtonElement;
        if (uploadButton) {
            uploadButton.click();
        }
    };

    const categoryStats = useMemo(() => {
        const stats: { [key in DocumentCategory]?: number } = {};

        // Only count documents that are not processing
        documents.forEach(doc => {
            const status = getDocumentProcessingStatus(doc);
            if (status !== 'processing') {
                stats[doc.category] = (stats[doc.category] || 0) + 1;
            }
        });

        // Initialize all categories with 0 if not present
        ALL_CATEGORIES.forEach(cat => {
            if (!stats[cat]) stats[cat] = 0;
        });

        return stats;
    }, [documents]);

    const recentDocuments = useMemo(() => {
        // Filter out processing documents from recent list
        const completedDocs = documents.filter(doc => getDocumentProcessingStatus(doc) !== 'processing');
        return [...completedDocs].sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()).slice(0, 5);
    }, [documents]);


    return (
    <div
        className="relative h-full pt-28 pb-20"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
        {/* Drag Overlay */}
        {isDraggingOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-teal-500/20 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-2xl text-center border-4 border-dashed border-teal-500">
                    <UploadIcon className="w-24 h-24 mx-auto mb-6 text-teal-600 dark:text-teal-400 animate-bounce" />
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Drop files to upload</h2>
                    <p className="text-slate-600 dark:text-slate-400">Release to open upload dialog</p>
                </div>
            </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" text="Loading your health records..." />
                </div>
            ) : documents.length > 0 ? (
                <div className="space-y-8">
                    {/* Category Breakdown */}
                    <section>
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Browse by Category</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {ALL_CATEGORIES.map(category => (
                                <CategoryTile
                                    key={category}
                                    category={category}
                                    count={categoryStats[category] || 0}
                                    onClick={() => onNavigateToRecords(category)}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Recent Documents Section */}
                    {recentDocuments.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Recent Documents</h2>
                            <ul className="space-y-1">
                                {recentDocuments.map(doc => (
                                    <RecentDocumentItem key={doc.id} document={doc} onSelect={onSelectDocument} />
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] px-4">
                  {/* Main Welcome Content */}
                  <div className="text-center max-w-2xl">
                    <EmptyDashboard className="max-w-sm mx-auto mb-8" />

                    <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4 tracking-tight">
                      Welcome to Health Vault
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                      Your secure, AI-powered health record manager. Upload documents, get instant insights, and take control of your health data.
                    </p>

                    <p className="text-lg text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 flex-wrap">
                      <span>Click the</span>
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/30">
                        <UploadIcon className="w-5 h-5" />
                        Upload
                      </span>
                      <span>button to get started</span>
                    </p>
                  </div>

                  {/* Privacy Guarantee - Fixed at bottom */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-4">
                    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-stone-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm">
                      <ShieldCheckIcon className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Your privacy is protected.</span> All documents are encrypted and stored securely.
                      </p>
                    </div>
                  </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default Dashboard;