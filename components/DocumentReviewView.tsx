import React, { useState, useEffect } from 'react';
import { DocumentFile, DocumentCategory } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import EditableStructuredData from './EditableStructuredData';

interface DocumentReviewViewProps {
  document: DocumentFile;
  onClose: () => void;
  onSave: (id: string, updates: Partial<DocumentFile>) => void;
  onDelete: (id: string) => void;
}

const categories: DocumentCategory[] = ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other'];

const DocumentReviewView: React.FC<DocumentReviewViewProps> = ({ document, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(document.title || '');
  const [category, setCategory] = useState(document.category || 'Other');
  const [structuredData, setStructuredData] = useState(document.structuredData || {});
  const [userNotes, setUserNotes] = useState(document.userNotes || '');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = () => {
    onSave(document.id, { title, category, structuredData, userNotes });
  };
  
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this upload? This action cannot be undone.")) {
        onDelete(document.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in" onClick={onClose}>
        <div 
            className="relative w-full max-w-7xl h-full bg-stone-50 dark:bg-[#0B1120] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-stone-200 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Review Document</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md" title={document.name}>{document.name}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-colors"
                    aria-label="Close review"
                >
                    <XIcon className="h-6 w-6" />
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-grow flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
                {/* Left: Document Preview */}
                <div className="w-full lg:w-1/2 flex-shrink-0 flex flex-col bg-stone-100 dark:bg-black/40 rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden">
                    <div className="relative flex-grow overflow-auto flex items-center justify-center p-2">
                        <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 bg-white/70 dark:bg-slate-900/80 p-1 rounded-lg backdrop-blur-sm border border-stone-200 dark:border-slate-700">
                            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-slate-700/50 rounded-md transition-colors"><ZoomOutIcon className="w-5 h-5"/></button>
                            <button onClick={() => setZoom(1)} className="px-3 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-slate-700/50 rounded-md transition-colors">{Math.round(zoom * 100)}%</button>
                            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-slate-700/50 rounded-md transition-colors"><ZoomInIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s ease' }}>
                                {document.type.startsWith('image/') ? (
                                    <img src={document.base64Data} alt={document.name} className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
                                ) : (
                                    <embed src={document.base64Data} type="application/pdf" className="w-[800px] h-[calc(100vh-250px)] min-h-[500px] rounded-md" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right: Editable Data */}
                <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
                    <div className="space-y-6 flex-grow overflow-y-auto pr-2 -mr-2">
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Document Title</label>
                                <input 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800/60 border border-stone-300 dark:border-slate-700 rounded-lg p-2.5 text-base text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value as DocumentCategory)}
                                    className="w-full bg-white dark:bg-slate-800/60 border border-stone-300 dark:border-slate-700 rounded-lg p-2.5 text-base text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </section>
                        <section>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-lg">Verify Extracted Details</h3>
                            <div className="p-4 bg-stone-100 dark:bg-slate-900/50 rounded-xl border border-stone-200 dark:border-slate-800">
                                <EditableStructuredData category={category} data={structuredData} setData={setStructuredData} />
                            </div>
                        </section>
                        <section>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-lg">Add Your Notes</h3>
                            <textarea 
                                value={userNotes}
                                onChange={(e) => setUserNotes(e.target.value)}
                                placeholder="Add personal notes or reminders here..."
                                rows={5}
                                className="w-full text-base bg-white dark:bg-slate-800/60 rounded-xl p-3 border border-stone-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-500"
                            />
                        </section>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-end p-4 border-t border-stone-200 dark:border-slate-800 space-x-4 bg-stone-50 dark:bg-[#0B1120]">
                <button onClick={handleDelete} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-base font-semibold text-red-600 dark:text-red-400 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 transition-colors">
                    <TrashIcon className="w-5 h-5" />
                    <span>Delete Upload</span>
                </button>
                <button onClick={handleSave} className="flex items-center space-x-2 px-6 py-2 rounded-lg text-base font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Confirm & Save</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default DocumentReviewView;