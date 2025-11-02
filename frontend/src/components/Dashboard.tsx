import React, { useMemo } from 'react';
import { DocumentFile, DocumentCategory } from '../types';
import { formatRelativeTime } from '../utils/formatters';
import { categoryInfoMap } from '../utils/category-info';
import { EmptyDashboard } from './illustrations/EmptyDashboard';


interface DashboardProps {
  documents: DocumentFile[];
  onNavigateToRecords: (category: DocumentCategory) => void;
  onSelectDocument: (id: string) => void;
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
             <p className="text-sm text-slate-500 dark:text-slate-400">{count} record{count !== 1 ? 's' : ''}</p>
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
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{document.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{document.category}</p>
                </div>
            </div>
            <p className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 ml-4">{formatRelativeTime(document.uploadDate)}</p>
          </button>
        </li>
    );
}


const Dashboard: React.FC<DashboardProps> = ({ documents, onNavigateToRecords, onSelectDocument }) => {
    
    const categoryStats = useMemo(() => {
        const stats = documents.reduce((acc, doc) => {
            if (doc.status === 'complete') {
                acc[doc.category] = (acc[doc.category] || 0) + 1;
            }
            return acc;
        }, {} as { [key in DocumentCategory]?: number });

        ALL_CATEGORIES.forEach(cat => {
            if (!stats[cat]) {
                stats[cat] = 0;
            }
        });

        return stats;
    }, [documents]);
    
    const recentDocuments = useMemo(() => {
        return [...documents].sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()).slice(0, 5);
    }, [documents]);

  
    return (
    <div className="h-full pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {documents.length > 0 ? (
                <div className="space-y-8">
                    {/* Category Breakdown */}
                    <section>
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Browse by Category</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {Object.entries(categoryStats).map(([category, count]) => (
                                <CategoryTile key={category} category={category as DocumentCategory} count={count!} onClick={() => onNavigateToRecords(category as DocumentCategory)} />
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
                <div className="text-center py-16">
                  <EmptyDashboard className="max-w-sm mx-auto" />
                  <h2 className="mt-8 text-2xl font-bold text-slate-800 dark:text-white">Your Health Vault is ready</h2>
                  <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-lg mx-auto">Upload your first medical record to get started. Health Vault will help you organize and understand your health history.</p>
                </div>
            )}

        </div>
    </div>
  );
};

export default Dashboard;