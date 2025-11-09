import React, { useState, useMemo, useEffect } from 'react';
import { DocumentFile, DocumentCategory } from '../types';
import DocumentCard from './DocumentCard';
import { SearchIcon } from './icons/SearchIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import UploadModal from './UploadModal';
import { groupDocumentsByMonth } from '../utils/formatters';
import { EmptyRecords } from './illustrations/EmptyRecords';

interface RecordsProps {
  documents: DocumentFile[];
  onFilesChange: (files: DocumentFile[]) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentFile>) => void;
  onRemoveDocument: (id:string) => void;
  onRemoveMultipleDocuments: (ids: string[]) => void;
  onSelectDocument: (id: string) => void;
  initialFilter: DocumentCategory | 'all';
}

const categories: DocumentCategory[] = ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other'];

const FilterPill: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 whitespace-nowrap border ${
            isActive
                ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 border-stone-300 dark:border-slate-700'
        }`}
    >
        {label}
    </button>
);

const Records: React.FC<RecordsProps> = ({ 
    documents, 
    onFilesChange, 
    onUpdateDocument, 
    onRemoveDocument, 
    onRemoveMultipleDocuments, 
    onSelectDocument, 
    initialFilter, 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState(initialFilter);
    const [sortBy, setSortBy] = useState('date_desc');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        setFilterType(initialFilter);
    }, [initialFilter]);

    const sortedAndFilteredDocuments = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const filtered = documents.filter(doc => {
            const matchesSearch =
                (doc.displayName || '').toLowerCase().includes(lowercasedSearchTerm) ||
                (doc.aiAnalysis?.searchSummary || '').toLowerCase().includes(lowercasedSearchTerm) ||
                (doc.aiAnalysis?.structuredData && Object.values(doc.aiAnalysis.structuredData).some(value =>
                    String(value).toLowerCase().includes(lowercasedSearchTerm)
                ));
            
            let matchesFilter = true;
            if (filterType !== 'all') {
                matchesFilter = doc.category === filterType;
            }

            return matchesSearch && matchesFilter;
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
    }, [documents, searchTerm, filterType, sortBy]);

    const groupedDocuments = useMemo(() => groupDocumentsByMonth(sortedAndFilteredDocuments), [sortedAndFilteredDocuments]);
    
    const filterOptions = [ { label: 'All', value: 'all' }, ...categories.map(c => ({ label: c, value: c })) ];

    return (
        <>
        <div className="h-full pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Upload Button */}
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white truncate">My Health Records</h1>
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center justify-center px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition-all transform hover:scale-105"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Upload New Record
                    </button>
                </div>

                {/* Controls Panel */}
                <div className="p-3 mb-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm space-y-3 sticky top-28 z-30">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:flex-1">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 z-10" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="relative w-full pl-11 pr-4 py-2 bg-stone-100 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                         <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="w-full sm:w-auto bg-stone-100 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        >
                            <option value="date_desc">Date: Newest</option>
                            <option value="date_asc">Date: Oldest</option>
                            <option value="name_asc">Name: A-Z</option>
                            <option value="name_desc">Name: Z-A</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2">
                         {filterOptions.map(opt => <FilterPill key={opt.value} label={opt.label} isActive={filterType === opt.value} onClick={() => setFilterType(opt.value as DocumentCategory | 'all')} /> )}
                    </div>
                </div>
                
                {/* Records List */}
                <div className="space-y-6">
                    {documents.length > 0 ? (
                        Object.keys(groupedDocuments).length > 0 ? (
                            Object.entries(groupedDocuments).map(([monthYear, docs]) => (
                                <div key={monthYear} className="relative">
                                    <div className="sticky top-[188px] z-20 py-1 bg-stone-50/80 dark:bg-[#0B1120]/80 backdrop-blur-sm">
                                        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{monthYear}</h2>
                                    </div>
                                    <div className="space-y-3 mt-2">
                                        {docs.map((doc) => (
                                            <DocumentCard 
                                                key={doc.id} 
                                                document={doc} 
                                                onRemove={onRemoveDocument} 
                                                onView={onSelectDocument}
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
        
        <UploadModal 
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onFilesChange={onFilesChange}
            onUpdateDocument={onUpdateDocument}
        />
        </>
    );
};

export default Records;