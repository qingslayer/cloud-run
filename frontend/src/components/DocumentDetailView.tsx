import React, { useState } from 'react';
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
  const [editedDisplayName, setEditedDisplayName] = useState(document.displayName || '');
  const [editedCategory, setEditedCategory] = useState(document.category);
  const [editedStructuredData, setEditedStructuredData] = useState(document.aiAnalysis?.structuredData || {});
  const [isSaving, setIsSaving] = useState(false);
  const { color, lightColor } = categoryInfoMap[document.category];

  const handleStartEdit = () => {
    setEditedDisplayName(document.displayName || '');
    setEditedCategory(document.category);
    setEditedStructuredData(document.aiAnalysis?.structuredData || {});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(document.id, {
        displayName: editedDisplayName,
        category: editedCategory,
        aiAnalysis: {
          ...document.aiAnalysis,
          category: editedCategory,
          structuredData: editedStructuredData
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save document:', error);
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

        {/* Save/Cancel Buttons */}
        {isEditing && (
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

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full flex items-center justify-center px-4 py-3 bg-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition-all transform hover:scale-105"
                    >
                        <EyeIcon className="w-5 h-5 mr-2" />
                        View Original Document
                    </button>

                    {onDelete && !isEditing && (
                      <button
                        onClick={() => onDelete(document.id)}
                        className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all transform hover:scale-105"
                      >
                        <TrashIcon className="w-5 h-5 mr-2" />
                        Delete Document Forever
                      </button>
                    )}
                </div>

                {/* Right Column: Key Information */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl shadow-sm">
                        <div className="p-5">
                            {isEditing ? (
                              <>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Edit Extracted Details</h2>
                                <EditableStructuredData data={editedStructuredData} setData={setEditedStructuredData} />
                              </>
                            ) : (
                              <StructuredDataDisplay data={document.aiAnalysis?.structuredData} category={document.category as DocumentCategory} />
                            )}
                        </div>
                    </div>
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