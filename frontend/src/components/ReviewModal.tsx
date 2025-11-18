import React, { useState, useEffect } from 'react';
import { DocumentFile, DocumentCategory, getDocumentProcessingStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { PencilIcon } from './icons/PencilIcon';
import EditableStructuredData from './EditableStructuredData';
import { categoryInfoMap } from '../utils/category-info';
import { CATEGORIES } from '../config/constants';

interface ReviewModalProps {
  document: DocumentFile;
  onApprove: (updates: Partial<DocumentFile>) => Promise<void>;
  onReviewLater: (updates: Partial<DocumentFile>) => Promise<void>;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ document, onApprove, onReviewLater, onClose }) => {
  const [editedDisplayName, setEditedDisplayName] = useState(document.displayName || document.filename);
  const [editedCategory, setEditedCategory] = useState(document.category as DocumentCategory);
  const [editedStructuredData, setEditedStructuredData] = useState(document.aiAnalysis?.structuredData || {});
  const [editedNotes, setEditedNotes] = useState(document.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const status = getDocumentProcessingStatus(document);
  const { color, lightColor } = categoryInfoMap[editedCategory];

  // Reset state when document changes
  useEffect(() => {
    setEditedDisplayName(document.displayName || document.filename);
    setEditedCategory(document.category as DocumentCategory);
    setEditedStructuredData(document.aiAnalysis?.structuredData || {});
    setEditedNotes(document.notes || '');
  }, [document]);

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      await onApprove({
        displayName: editedDisplayName,
        category: editedCategory,
        'aiAnalysis.structuredData': editedStructuredData,
        notes: editedNotes,
        reviewedAt: new Date(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to approve document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewLater = async () => {
    setIsSaving(true);
    try {
      // Save changes but DON'T mark as reviewed (no reviewedAt field)
      await onReviewLater({
        displayName: editedDisplayName,
        category: editedCategory,
        'aiAnalysis.structuredData': editedStructuredData,
        notes: editedNotes,
        // Intentionally NOT including reviewedAt - document stays in pending_review state
      });
      onClose();
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              {status === 'processing' ? (
                <>
                  <div className="animate-pulse rounded-full h-3 w-3 bg-amber-500" />
                  AI Processing...
                </>
              ) : (
                <>
                  <PencilIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  Review Document
                </>
              )}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {status === 'processing'
                ? 'AI is analyzing your document. Please wait...'
                : 'Verify and edit the AI-generated information below'}
            </p>
          </div>
          <button
            onClick={onClose} // Discards all changes and closes modal without saving
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close and discard changes"
            title="Close without saving"
          >
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {status === 'processing' ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent mb-4" />
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Analyzing document with AI...
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                This usually takes 5-15 seconds
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Document Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Document Preview
                </h3>
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {document.downloadUrl ? (
                    document.filename.endsWith('.pdf') ? (
                      <iframe
                        src={document.downloadUrl}
                        className="w-full h-96"
                        title="Document preview"
                      />
                    ) : (
                      <img
                        src={document.downloadUrl}
                        alt={document.filename}
                        className="w-full h-auto"
                      />
                    )
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center text-slate-400">
                      <p>Loading preview...</p>
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  <p className="font-medium">Filename:</p>
                  <p className="truncate">{document.filename}</p>
                </div>
              </div>

              {/* Right: Editable Fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value as DocumentCategory)}
                    className={`w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none ${lightColor} ${color}`}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={editedDisplayName}
                    onChange={(e) => setEditedDisplayName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-base text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Enter document title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Extracted Information
                  </label>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <EditableStructuredData
                      data={editedStructuredData}
                      setData={setEditedStructuredData}
                      category={editedCategory}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add any additional notes or context..."
                    className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-base text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {status !== 'processing' && (
          <div className="flex items-center justify-between p-6 border-t border-stone-200 dark:border-slate-700">
            <button
              onClick={handleReviewLater}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
            >
              Review Later
            </button>
            <button
              onClick={handleApprove}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors font-medium shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Approve & Save</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
