import React, { useState, useMemo, useEffect } from 'react';
import { DocumentFile, DocumentCategory } from '../types';
import DocumentCard from './DocumentCard';
import { SearchIcon } from './icons/SearchIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import { groupDocumentsByMonth } from '../utils/formatters';
import { EmptyRecords } from './illustrations/EmptyRecords';
import { categoryInfoMap } from '../utils/category-info';

interface RecordsProps {
  documents: DocumentFile[];
  onFilesChange: (files: DocumentFile[]) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentFile>) => void;
  onRemoveDocument: (id:string) => void;
  onRemoveMultipleDocuments: (ids: string[]) => void;
  onSelectDocument: (id: string) => void;
  initialFilter: DocumentCategory | 'all';
  onError?: (message: string) => void;
  viewedDocuments?: Set<string>;  // Track viewed documents
}

const categories: DocumentCategory[] = ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other'];

const FilterPill: React.FC<{ label: string; category?: DocumentCategory; isActive: boolean; onClick: () => void; count?: number }> = ({ label, category, isActive, onClick, count }) => {
    const IconComponent = category ? categoryInfoMap[category]?.icon : null;

    return (
        <button
            onClick={onClick}
            className={`relative flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
        >
            {IconComponent && (
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-current' : categoryInfoMap[category!].color}`} />
            )}
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${
                    isActive
                        ? 'bg-white/20 dark:bg-slate-900/20 text-current'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                    {count}
                </span>
            )}
            {isActive && (
                <div className="absolute inset-0 rounded-full ring-2 ring-slate-900 dark:ring-white ring-opacity-20 dark:ring-opacity-20 pointer-events-none" />
            )}
        </button>
    );
};

const Records: React.FC<RecordsProps> = ({
    documents,
    onFilesChange,
    onUpdateDocument,
    onRemoveDocument,
    onRemoveMultipleDocuments,
    onSelectDocument,
    initialFilter,
    onError,
    viewedDocuments = new Set(),
}) => {
    const [filterType, setFilterType] = useState(initialFilter);
    const [sortBy, setSortBy] = useState('date_desc');
    const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

    useEffect(() => {
        setFilterType(initialFilter);
    }, [initialFilter]);

    const sortedAndFilteredDocuments = useMemo(() => {
        const now = new Date();

        const filtered = documents.filter(doc => {
            // Only show documents that have completed AI analysis
            if (doc.status !== 'complete') {
                return false;
            }

            // Category filter
            let matchesCategory = true;
            if (filterType !== 'all') {
                matchesCategory = doc.category === filterType;
            }

            // Date filter
            let matchesDate = true;
            if (dateFilter !== 'all') {
                const docDate = new Date(doc.uploadDate);
                const diffTime = now.getTime() - docDate.getTime();
                const diffDays = diffTime / (1000 * 3600 * 24);

                switch (dateFilter) {
                    case 'week':
                        matchesDate = diffDays <= 7;
                        break;
                    case 'month':
                        matchesDate = diffDays <= 30;
                        break;
                    case 'year':
                        matchesDate = diffDays <= 365;
                        break;
                }
            }

            return matchesCategory && matchesDate;
        });

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date_asc':
                    return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
                case 'name_asc':
                    return (a.displayName || '').localeCompare(b.displayName || '');
                case 'name_desc':
                    return (b.displayName || '').localeCompare(a.displayName || '');
                case 'date_desc':
                default:
                    return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
            }
        });
    }, [documents, filterType, dateFilter, sortBy]);

    const groupedDocuments = useMemo<{ [key: string]: DocumentFile[] }>(() => groupDocumentsByMonth(sortedAndFilteredDocuments), [sortedAndFilteredDocuments]);

    // Calculate category counts for filter pills (only completed documents)
    const categoryCounts = useMemo(() => {
        const completedDocs = documents.filter(doc => doc.status === 'complete');
        const counts: { [key: string]: number } = { all: completedDocs.length };
        categories.forEach(cat => {
            counts[cat] = completedDocs.filter(doc => doc.category === cat).length;
        });
        return counts;
    }, [documents]);

    return (
        <>
        <div className="h-full pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white truncate">My Health Records</h1>
                </div>

                {/* Controls Panel */}
                <div className="mb-8 space-y-6">
                    {/* Sort Control */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Sort by</label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:ring-opacity-20 focus:outline-none transition-colors"
                        >
                            <option value="date_desc">Date: Newest</option>
                            <option value="date_asc">Date: Oldest</option>
                            <option value="name_asc">Name: A-Z</option>
                            <option value="name_desc">Name: Z-A</option>
                        </select>
                    </div>

                    {/* Category filters */}
                    <div>
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 block">Filter by category</label>
                        <div className="flex flex-wrap items-center gap-2">
                            <FilterPill
                                label="All"
                                isActive={filterType === 'all'}
                                onClick={() => setFilterType('all')}
                                count={categoryCounts.all}
                            />
                            {categories.map(cat => (
                                <FilterPill
                                    key={cat}
                                    label={cat}
                                    category={cat}
                                    isActive={filterType === cat}
                                    onClick={() => setFilterType(cat)}
                                    count={categoryCounts[cat]}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Date filters */}
                    <div>
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 block">Time period</label>
                        <div className="flex flex-wrap items-center gap-2">
                            <FilterPill label="All Time" isActive={dateFilter === 'all'} onClick={() => setDateFilter('all')} />
                            <FilterPill label="Past Week" isActive={dateFilter === 'week'} onClick={() => setDateFilter('week')} />
                            <FilterPill label="Past Month" isActive={dateFilter === 'month'} onClick={() => setDateFilter('month')} />
                            <FilterPill label="Past Year" isActive={dateFilter === 'year'} onClick={() => setDateFilter('year')} />
                        </div>
                    </div>
                </div>
                
                {/* Records List */}
                <div className="space-y-6">
                    {documents.length > 0 ? (
                        Object.keys(groupedDocuments).length > 0 ? (
                            Object.entries(groupedDocuments).map(([monthYear, docs]: [string, DocumentFile[]]) => (
                                <div key={monthYear} className="relative">
                                    <div className="sticky top-28 z-20 py-2 -mx-4 px-4 bg-stone-50/95 dark:bg-[#0B1120]/95 backdrop-blur-sm">
                                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{monthYear}</h2>
                                    </div>
                                    <div className="space-y-3 mt-3">
                                        {docs.map((doc) => (
                                            <DocumentCard
                                                key={doc.id}
                                                document={doc}
                                                onRemove={onRemoveDocument}
                                                onView={onSelectDocument}
                                                onEdit={onSelectDocument}
                                                isViewed={viewedDocuments.has(doc.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed border-stone-300/70 dark:border-slate-800/70 rounded-3xl bg-white dark:bg-slate-900/50">
                                <SearchIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                                <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-200">No matching documents</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or filter.</p>
                            </div>
                        )
                    ) : (
                         <div className="text-center py-16">
                            <EmptyRecords className="max-w-xs mx-auto" />
                            <h3 className="mt-8 text-2xl font-bold text-slate-800 dark:text-slate-200">Your record gallery is empty</h3>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">Click the "Upload" button to add your first health record.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

export default Records;