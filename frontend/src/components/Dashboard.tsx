import React, { useMemo } from 'react';
import { DocumentFile, DocumentCategory } from '../types';
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
            className={`group relative text-left w-full h-full flex flex-col justify-between p-5 rounded-3xl shadow-sm transition-all duration-300 overflow-hidden border
            ${gradient}
            border-stone-200/80 dark:border-slate-800
            hover:shadow-xl hover:scale-[1.03] hover:border-teal-400/80 dark:hover:border-teal-500/80`}
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
            className="w-full text-left flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-colors duration-200"
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
    
    const categoryStats = useMemo(() => {
        const stats: { [key in DocumentCategory]?: number } = {};

        documents.forEach(doc => {
            stats[doc.category] = (stats[doc.category] || 0) + 1;
        });

        // Initialize all categories with 0 if not present
        ALL_CATEGORIES.forEach(cat => {
            if (!stats[cat]) stats[cat] = 0;
        });

        return stats;
    }, [documents]);
    
    const recentDocuments = useMemo(() => {
        return [...documents].sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()).slice(0, 5);
    }, [documents]);

  
    return (
    <div className="h-full pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header - Always visible */}
            {!isLoading && (
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Health Dashboard</h1>
                </div>
            )}

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
                <div className="text-center py-8 max-w-4xl mx-auto">
                  <EmptyDashboard className="max-w-md mx-auto mb-8" />

                  {/* Welcome Message */}
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Welcome to Health Vault</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                      Your secure, AI-powered health record manager. Click the <span className="font-semibold">Upload</span> button in the top right to add your first document.
                    </p>
                  </div>


                  {/* Getting Started Guide */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700 rounded-2xl p-6 text-left">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                        <UploadIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">1. Upload Documents</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Drop any medical document - lab results, prescriptions, imaging reports, or doctor's notes. We support PDF and images.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700 rounded-2xl p-6 text-left">
                      <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-4">
                        <SparklesIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">2. AI Organizes</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Our AI automatically categorizes documents and extracts key information like test results, medications, and dates.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700 rounded-2xl p-6 text-left">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                        <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">3. Search & Understand</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Ask questions like "What were my cholesterol levels?" and get instant AI-powered answers from your records.
                      </p>
                    </div>
                  </div>

                  {/* Privacy Note */}
                  <div className="mt-12 flex items-start justify-center space-x-3 text-left max-w-2xl mx-auto bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <ShieldCheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-800 dark:text-slate-200">Your privacy is protected.</strong> All documents are encrypted and stored securely. Only you can access your health data.
                    </p>
                  </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default Dashboard;