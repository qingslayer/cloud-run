import React, { useState, useEffect } from 'react';
import { DocumentFile, DocumentCategory } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import StructuredDataDisplay from './StructuredDataDisplay';
import EditableStructuredData from './EditableStructuredData';
import { formatRelativeTime } from '../utils/formatters';
import { EyeIcon } from './icons/EyeIcon';
import DocumentPreviewModal from './DocumentPreviewModal';
import { CalendarIcon } from './icons/CalendarIcon';
import { categoryInfoMap } from '../utils/category-info';
import { ClipboardNotesIcon } from './icons/ClipboardNotesIcon';
import { getDocumentDate } from '../utils/health-helpers';

interface NavigationContext {
  allDocuments: DocumentFile[];
  currentIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface DocumentDetailViewProps {
  documentData: DocumentFile;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<DocumentFile>) => Promise<void>;
  onDelete?: (id: string) => void;
  navigationContext?: NavigationContext;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const categories: DocumentCategory[] = ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other'];

const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({ documentData, onClose, onUpdate, onDelete, navigationContext, onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State for all editable fields
  const [editedDisplayName, setEditedDisplayName] = useState(documentData.displayName || '');
  const [editedCategory, setEditedCategory] = useState(documentData.category);
  const [editedNotes, setEditedNotes] = useState(documentData.notes || '');
  const [editedStructuredData, setEditedStructuredData] = useState(documentData.aiAnalysis?.structuredData || {});

  const [isSaving, setIsSaving] = useState(false);
  const { color, lightColor } = categoryInfoMap[documentData.category];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' && navigationContext?.hasPrev && onNavigate) {
        e.preventDefault();
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && navigationContext?.hasNext && onNavigate) {
        e.preventDefault();
        onNavigate('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigationContext, onNavigate]);

  // When the documentData prop changes (e.g., after a save), reset the state
  useEffect(() => {
    if (!isEditing) {
      setEditedDisplayName(documentData.displayName || '');
      setEditedCategory(documentData.category);
      setEditedNotes(documentData.notes || '');
      setEditedStructuredData(documentData.aiAnalysis?.structuredData || {});
    }
  }, [documentData, isEditing]);


  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset state to original documentData values
    setEditedDisplayName(documentData.displayName || '');
    setEditedCategory(documentData.category);
    setEditedNotes(documentData.notes || '');
    setEditedStructuredData(documentData.aiAnalysis?.structuredData || {});
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      // Construct the payload with dot notation for nested fields
      const updatePayload: { [key: string]: any } = {
        displayName: editedDisplayName,
        category: editedCategory,
        notes: editedNotes,
        'aiAnalysis.structuredData': editedStructuredData,
      };

      await onUpdate(documentData.id, updatePayload);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save document:', error);
      // Error toast is handled in App.tsx
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <div className="flex flex-col h-full bg-stone-50 dark:bg-[#0B1120] overflow-hidden">
      {/* Header with Edit Controls */}
      <header className="flex-shrink-0 flex items-center justify-end p-4 border-b border-stone-200 dark:border-slate-800">
        {/* Edit Mode Toggle */}
        {!isEditing && onUpdate && (
          <button
            onClick={handleStartEdit}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-md"
          >
            <PencilIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">Edit Document</span>
          </button>
        )}

        {/* Save/Cancel/Delete Buttons for Edit Mode */}
        {isEditing && (
          <div className="flex items-center justify-between w-full">
            {/* Delete button on the left */}
            {onDelete && (
              <button
                onClick={() => onDelete(documentData.id)}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">Delete</span>
              </button>
            )}

            {/* Save/Cancel buttons on the right */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <XIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">Cancel</span>
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                <span className="text-sm font-semibold">{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <div className="mb-8">
              {isEditing ? (
                <>
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 block">Category</label>
                  <select
                    value={editedCategory}
                    onChange={e => setEditedCategory(e.target.value as DocumentCategory)}
                    className="mb-3 bg-white dark:bg-slate-800/60 border border-stone-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>

                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 block mt-4">Document Title</label>
                  <input
                    type="text"
                    value={editedDisplayName}
                    onChange={e => setEditedDisplayName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800/60 border border-stone-300 dark:border-slate-700 rounded-lg p-3 text-3xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Enter document title"
                  />
                </>
              ) : (
                <>
                  <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${lightColor} ${color}`}>
                      {documentData.category}
                  </span>
                  <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-3">{documentData.displayName}</h1>
                </>
              )}
            </div>
            
            {/* Document Overview & Key Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metadata & Document Preview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Document Details</h2>
                        <div className="space-y-4 text-sm">
                            {/* Document Date (if extracted) */}
                            {getDocumentDate(documentData) && (
                              <div className="flex items-start">
                                  <CalendarIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                                  <div>
                                      <p className="font-semibold text-slate-700 dark:text-slate-300">Document Date</p>
                                      <p className="text-slate-500 dark:text-slate-400">
                                        {getDocumentDate(documentData)!.toLocaleDateString()} ({formatRelativeTime(getDocumentDate(documentData)!)})
                                      </p>
                                  </div>
                              </div>
                            )}

                            {/* Upload Date */}
                            <div className="flex items-start">
                                <CalendarIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                                      {getDocumentDate(documentData) ? 'Uploaded' : 'Upload Date'}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400">
                                      {new Date(documentData.uploadDate).toLocaleDateString()} ({formatRelativeTime(new Date(documentData.uploadDate))})
                                    </p>
                                </div>
                            </div>

                            {isEditing && (
                              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                  <strong>Note:</strong> Original filename, file type, and dates cannot be changed.
                                </p>
                              </div>
                            )}

                            {/* Compact Document Preview (like email attachment) */}
                            <div className="pt-4 border-t border-stone-200 dark:border-slate-700">
                              <div
                                  onClick={() => setIsModalOpen(true)}
                                  className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                              >
                                  {/* Small thumbnail/icon */}
                                  <div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden border border-slate-200 dark:border-slate-700">
                                      {documentData.downloadUrl ? (
                                          documentData.filename.endsWith('.pdf') ? (
                                              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">PDF</span>
                                              </div>
                                          ) : (
                                              <img src={documentData.downloadUrl} alt={documentData.filename} className="w-full h-full object-cover" />
                                          )
                                      ) : (
                                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800" />
                                      )}
                                  </div>

                                  {/* File info */}
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{documentData.filename}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click to view full document</p>
                                  </div>

                                  {/* View icon */}
                                  <EyeIcon className="w-5 h-5 text-slate-400 group-hover:text-teal-500 flex-shrink-0 transition-colors" />
                              </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Key Information */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl shadow-sm">
                        <div className="p-5">
                            {isEditing ? (
                              <>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Edit Extracted Details</h2>
                                <EditableStructuredData
                                  data={editedStructuredData}
                                  setData={setEditedStructuredData}
                                  category={editedCategory}
                                />
                              </>
                            ) : (
                              <StructuredDataDisplay data={documentData.aiAnalysis?.structuredData} category={documentData.category as DocumentCategory} />
                            )}
                        </div>
                    </div>

                    {/* Notes Section - Always visible */}
                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                                <ClipboardNotesIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-3" />
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Notes</h2>
                            </div>
                            {!isEditing && onUpdate && (
                                <button
                                    onClick={handleStartEdit}
                                    className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                                >
                                    {documentData.notes ? 'Edit' : 'Add notes'}
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <textarea
                                value={editedNotes}
                                onChange={(e) => setEditedNotes(e.target.value)}
                                placeholder="Add any additional notes or comments about this document..."
                                className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md p-3 text-base text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none resize-y min-h-[120px]"
                            />
                        ) : documentData.notes ? (
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{documentData.notes}</p>
                        ) : (
                            <p className="text-slate-400 dark:text-slate-500 text-sm italic">No notes added yet. Click "Add notes" to get started.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
    {isModalOpen && <DocumentPreviewModal document={documentData} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default DocumentDetailView;