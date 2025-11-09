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

interface DocumentDetailViewProps {
  document: DocumentFile;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<DocumentFile>) => Promise<void>;
  onDelete?: (id: string) => void;
}

const categories: DocumentCategory[] = ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other'];

const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({ document, onClose, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for all editable fields
  const [editedDisplayName, setEditedDisplayName] = useState(document.displayName || '');
  const [editedCategory, setEditedCategory] = useState(document.category);
  const [editedNotes, setEditedNotes] = useState(document.notes || '');
  const [editedStructuredData, setEditedStructuredData] = useState(document.aiAnalysis?.structuredData || {});

  const [isSaving, setIsSaving] = useState(false);
  const { color, lightColor } = categoryInfoMap[document.category];

  // When the document prop changes (e.g., after a save), reset the state
  useEffect(() => {
    if (!isEditing) {
      setEditedDisplayName(document.displayName || '');
      setEditedCategory(document.category);
      setEditedNotes(document.notes || '');
      setEditedStructuredData(document.aiAnalysis?.structuredData || {});
    }
  }, [document, isEditing]);


  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset state to original document values
    setEditedDisplayName(document.displayName || '');
    setEditedCategory(document.category);
    setEditedNotes(document.notes || '');
    setEditedStructuredData(document.aiAnalysis?.structuredData || {});
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

      await onUpdate(document.id, updatePayload);
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
    <div className="absolute inset-0 bg-stone-50 dark:bg-[#0B1120] z-50 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-2 mb-4">
        <button onClick={onClose} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">Back to Timeline</span>
        </button>

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
                onClick={() => onDelete(document.id)}
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
      <main className="flex-grow overflow-y-auto pr-2">
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
                      {document.category}
                  </span>
                  <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-3">{document.displayName}</h1>
                </>
              )}
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

                            {isEditing && (
                              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                  <strong>Note:</strong> Original filename, file type, and upload date cannot be changed.
                                </p>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Document Preview Thumbnail */}
                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Original Document</h2>
                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-all hover:shadow-lg max-w-[200px] mx-auto"
                        >
                            {document.downloadUrl ? (
                                document.filename.endsWith('.pdf') ? (
                                    <div className="aspect-[3/4] relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                                        {/* Blurred background pattern */}
                                        <div className="absolute inset-0 opacity-30">
                                            <div className="absolute top-4 left-4 right-4 h-2 bg-slate-300 dark:bg-slate-600 rounded blur-sm" />
                                            <div className="absolute top-8 left-4 right-8 h-2 bg-slate-300 dark:bg-slate-600 rounded blur-sm" />
                                            <div className="absolute top-12 left-4 right-12 h-2 bg-slate-300 dark:bg-slate-600 rounded blur-sm" />
                                            <div className="absolute top-20 left-4 right-4 h-1.5 bg-slate-300 dark:bg-slate-600 rounded blur-sm" />
                                            <div className="absolute top-24 left-4 right-6 h-1.5 bg-slate-300 dark:bg-slate-600 rounded blur-sm" />
                                            <div className="absolute top-28 left-4 right-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded blur-sm" />
                                            <div className="absolute top-32 left-4 right-8 h-1.5 bg-slate-300 dark:bg-slate-600 rounded blur-sm" />
                                        </div>
                                        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/30 dark:bg-black/30" />
                                        <div className="relative h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-12 h-14 mx-auto mb-2 bg-slate-600 dark:bg-slate-400 rounded-sm flex items-center justify-center shadow-sm">
                                                    <span className="text-white dark:text-slate-900 font-bold text-xs">PDF</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 px-2 truncate">{document.filename}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative aspect-[3/4]">
                                        <img
                                            src={document.downloadUrl}
                                            alt={document.filename}
                                            className="w-full h-full object-cover blur-[2px]"
                                        />
                                        <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[1px]" />
                                    </div>
                                )
                            ) : (
                                <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">No preview</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 dark:group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                                    <div className="bg-white dark:bg-slate-800 rounded-full p-2.5 shadow-xl">
                                        <EyeIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="mt-3 w-full text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                            View full document →
                        </button>
                    </div>
                </div>

                {/* Right Column: Key Information & Notes */}
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
                                  notes={editedNotes}
                                  onNotesChange={setEditedNotes}
                                />
                              </>
                            ) : (
                              <StructuredDataDisplay data={document.aiAnalysis?.structuredData} category={document.category as DocumentCategory} />
                            )}
                        </div>
                    </div>
                    
                    {/* Notes Display */}
                    {!isEditing && document.notes && (
                        <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl shadow-sm p-5">
                            <div className="flex items-center mb-3">
                                <ClipboardNotesIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-3" />
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Notes</h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{document.notes}</p>
                        </div>
                    )}
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