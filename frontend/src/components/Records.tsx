import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DocumentFile, DocumentCategory, getDocumentProcessingStatus } from '../types';
import DocumentCard from './DocumentCard';
import { SearchIcon } from './icons/SearchIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import { groupDocumentsByMonth } from '../utils/formatters';
import { EmptyRecords } from './illustrations/EmptyRecords';
import { categoryInfoMap } from '../utils/category-info';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

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

    useEffect(() => {
        setFilterType(initialFilter);
    }, [initialFilter]);

    const sortedAndFilteredDocuments = useMemo(() => {
        const filtered = documents.filter(doc => {
            // Category filter - apply to all documents
            if (filterType !== 'all') {
                return doc.category === filterType;
            }

            return true;
        });

        return filtered.sort((a, b) => {
            // Sort processing/pending review documents to the top
            const statusA = getDocumentProcessingStatus(a);
            const statusB = getDocumentProcessingStatus(b);

            // Processing documents first
            if (statusA === 'processing' && statusB !== 'processing') return -1;
            if (statusA !== 'processing' && statusB === 'processing') return 1;

            // Then pending review
            if (statusA === 'pending_review' && statusB === 'reviewed') return -1;
            if (statusA === 'reviewed' && statusB === 'pending_review') return 1;

            // Within same status, apply user's sort preference
            switch (sortBy) {
                case 'date_asc':
                    return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
                case 'name_asc':
                    return (a.displayName || a.filename || '').localeCompare(b.displayName || b.filename || '');
                case 'name_desc':
                    return (b.displayName || b.filename || '').localeCompare(a.displayName || a.filename || '');
                case 'date_desc':
                default:
                    return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
            }
        });
    }, [documents, filterType, sortBy]);

    const groupedDocuments = useMemo<{ [key: string]: DocumentFile[] }>(() => groupDocumentsByMonth(sortedAndFilteredDocuments), [sortedAndFilteredDocuments]);

    // Calculate category counts for filter pills
    const categoryCounts = useMemo(() => {
        const counts: { [key: string]: number } = { all: documents.length };
        categories.forEach(cat => {
            counts[cat] = documents.filter(doc => doc.category === cat).length;
        });
        return counts;
    }, [documents]);

    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setSortDropdownOpen(false);
            }
        };

        if (sortDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sortDropdownOpen]);

    const getSortLabel = (value: string) => {
        switch (value) {
            case 'date_desc': return 'Newest';
            case 'date_asc': return 'Oldest';
            case 'name_asc': return 'A-Z';
            case 'name_desc': return 'Z-A';
            default: return 'Newest';
        }
    };

    // Scroll functionality for category pills
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScrollButtons();
        window.addEventListener('resize', checkScrollButtons);
        return () => window.removeEventListener('resize', checkScrollButtons);
    }, [filterType]); // Re-check when filter changes

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(checkScrollButtons, 300);
        }
    };

    return (
        <>
        <div className="h-full pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Filter and Sort Controls */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    {/* Category Pills with Scroll Arrows */}
                    <div className="relative flex-1 min-w-0 group">
                        {/* Left Scroll Arrow */}
                        {showLeftArrow && (
                            <button
                                onClick={() => scroll('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Scroll left"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                        )}

                        {/* Category Pills Container */}
                        <div
                            ref={scrollContainerRef}
                            onScroll={checkScrollButtons}
                            className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {['all', ...categories].map((cat) => {
                            const isAll = cat === 'all';
                            const count = isAll ? categoryCounts.all : categoryCounts[cat as DocumentCategory];
                            const isActive = isAll ? filterType === 'all' : filterType === cat;
                            const IconComponent = !isAll ? categoryInfoMap[cat as DocumentCategory]?.icon : null;
                            const colorClass = !isAll ? categoryInfoMap[cat as DocumentCategory]?.color : '';

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setFilterType(isAll ? 'all' : cat as DocumentCategory)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {!isAll && IconComponent && (
                                        <IconComponent className={`w-4 h-4 ${isActive ? '' : colorClass}`} />
                                    )}
                                    <span>{isAll ? 'All' : cat}</span>
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                                            isActive
                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                        </div>

                        {/* Right Scroll Arrow */}
                        {showRightArrow && (
                            <button
                                onClick={() => scroll('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Scroll right"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div ref={sortDropdownRef} className="relative flex-shrink-0">
                        <button
                            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Sort"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                            </svg>
                        </button>

                        {sortDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                                {[
                                    { value: 'date_desc', label: 'Newest' },
                                    { value: 'date_asc', label: 'Oldest' },
                                    { value: 'name_asc', label: 'A-Z' },
                                    { value: 'name_desc', label: 'Z-A' }
                                ].map(({ value, label }) => (
                                    <button
                                        key={value}
                                        onClick={() => {
                                            setSortBy(value);
                                            setSortDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                            sortBy === value
                                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Queue Banner */}
                {(() => {
                    const pendingReview = sortedAndFilteredDocuments.filter(
                        doc => getDocumentProcessingStatus(doc) === 'pending_review'
                    );
                    if (pendingReview.length === 0) return null;

                    return (
                        <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-400/60 dark:border-teal-600/60 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-500 dark:bg-teal-600 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                            {pendingReview.length} Document{pendingReview.length !== 1 ? 's' : ''} Pending Review
                                        </h3>
                                        <p className="text-sm text-teal-700 dark:text-teal-300">
                                            Click on documents below to review AI-generated information
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

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