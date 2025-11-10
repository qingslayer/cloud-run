import React, { useRef, useState, useEffect } from 'react';
import { DocumentFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { uploadDocument } from '../services/documentProcessor';

interface DocumentUploaderProps {
  onFilesChange: (files: DocumentFile[]) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentFile>) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onError?: (message: string) => void;
  compact?: boolean;
  uploadedDocuments?: DocumentFile[];  // To track processing status
  onSelectDocument?: (id: string) => void;  // Navigate to document
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UploadProgress {
  filename: string;
  documentId?: string;  // Track document ID for status updates
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onFilesChange,
  onUpdateDocument,
  onUploadStart,
  onUploadComplete,
  onError,
  compact = false,
  uploadedDocuments = [],
  onSelectDocument
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Monitor uploaded documents and update progress status when they complete processing
  useEffect(() => {
    uploadProgress.forEach((progress) => {
      if (progress.documentId && progress.status === 'processing') {
        const doc = uploadedDocuments.find(d => d.id === progress.documentId);
        if (doc && doc.status === 'complete') {
          // Document finished processing, update progress status
          setUploadProgress(prev => prev.map(p =>
            p.documentId === progress.documentId
              ? { ...p, status: 'complete' }
              : p
          ));

          // No longer auto-remove - let user dismiss or click to view
        }
      }
    });
  }, [uploadedDocuments, uploadProgress]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];

    // Validate files first
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        const errorMsg = `File type not supported: ${file.name}. Please upload PDF, JPG, or PNG files.`;
        onError?.(errorMsg);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        const errorMsg = `File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is ${MAX_SIZE_MB} MB.`;
        onError?.(errorMsg);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Signal upload start
    onUploadStart?.();
    setIsUploading(true);

    // Initialize progress tracking
    const progressArray: UploadProgress[] = validFiles.map(file => ({
      filename: file.name,
      status: 'uploading'
    }));
    setUploadProgress(progressArray);

    let successCount = 0;
    let errorCount = 0;

    // Upload each valid file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];

      try {
        console.log(`Uploading ${file.name}...`);

        // Update status to uploading
        setUploadProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'uploading' } : p
        ));

        // Upload to backend - backend will auto-trigger AI analysis
        const uploadedDoc = await uploadDocument(file, 'Other', file.name);

        console.log(`Upload successful: ${uploadedDoc.id}, status: ${uploadedDoc.status}`);

        // Update status to processing (AI is working) and store document ID
        setUploadProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'processing', documentId: uploadedDoc.id } : p
        ));

        // Add the uploaded document to the UI. The backend will process it asynchronously.
        onFilesChange([uploadedDoc]);

        // Don't mark as complete yet - will be done when document status changes
        successCount++;

      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';

        setUploadProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'error', error: errorMsg } : p
        ));

        onError?.(`Failed to upload ${file.name}. Please try again.`);
        errorCount++;
      }
    }

    // Clear the file input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Signal upload complete
    setIsUploading(false);
    onUploadComplete?.();

    // Don't auto-clear progress - wait for documents to finish processing
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files);
    }
  };


  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-500 border-t-transparent" />;
      case 'processing':
        return <div className="animate-pulse rounded-full h-4 w-4 bg-amber-500" />;
      case 'complete':
        return <div className="rounded-full h-4 w-4 bg-green-500" />;
      case 'error':
        return <div className="rounded-full h-4 w-4 bg-red-500" />;
    }
  };

  const getStatusText = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'AI analyzing...';
      case 'complete':
        return 'Ready to view!';
      case 'error':
        return 'Failed';
    }
  };

  const handleDocumentClick = (progress: UploadProgress) => {
    if (progress.status === 'complete' && progress.documentId && onSelectDocument) {
      onSelectDocument(progress.documentId);
      // Remove from progress list after navigating
      setUploadProgress(prev => prev.filter(p => p.documentId !== progress.documentId));
    }
  };

  const handleDismiss = (progressToRemove: UploadProgress, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setUploadProgress(prev => prev.filter(p => p !== progressToRemove));
  };

  return (
    <div className="space-y-4">
      <div
        onClick={isUploading ? undefined : handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`group relative block w-full rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          isUploading
            ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-60'
            : isDragging
              ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/30 cursor-pointer'
              : 'border-gray-300/70 dark:border-gray-700/70 hover:border-sky-500/80 dark:hover:border-sky-500/60 hover:bg-white/30 dark:hover:bg-black/10 cursor-pointer'
        }`}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
          accept="image/png, image/jpeg, application/pdf"
          disabled={isUploading}
        />
        {isUploading && uploadProgress.length === 0 ? (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-500 border-t-transparent mx-auto" />
            <span className="mt-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Uploading...
            </span>
          </>
        ) : (
          <>
            <UploadIcon className={`mx-auto h-10 w-10 transition-colors duration-300 ${isDragging ? 'text-sky-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-sky-500'}`} />
            <span className={`mt-2 block text-sm font-semibold transition-colors duration-300 ${isDragging ? 'text-sky-500 dark:text-sky-300' : 'text-gray-900 dark:text-gray-300 group-hover:text-sky-600 dark:group-hover:text-sky-400'}`}>
              Upload Documents
            </span>
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              PDF, JPG, PNG up to 10MB
            </span>
          </>
        )}
      </div>

      {/* Upload Progress List */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((progress, idx) => (
            <div
              key={idx}
              onClick={() => handleDocumentClick(progress)}
              className={`relative flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-stone-200 dark:border-slate-700 transition-all duration-200 ${
                progress.status === 'complete'
                  ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md'
                  : ''
              }`}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(progress.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {progress.filename}
                </p>
                <p className={`text-xs ${
                  progress.status === 'error' ? 'text-red-500' :
                  progress.status === 'complete' ? 'text-green-600 dark:text-green-400 font-medium' :
                  'text-slate-500 dark:text-slate-400'
                }`}>
                  {progress.error || getStatusText(progress.status)}
                </p>
              </div>
              {/* Dismiss button for complete or error status */}
              {(progress.status === 'complete' || progress.status === 'error') && (
                <button
                  onClick={(e) => handleDismiss(progress, e)}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;