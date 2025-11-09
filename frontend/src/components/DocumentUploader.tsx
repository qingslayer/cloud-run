import React, { useRef, useState } from 'react';
import { DocumentFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { uploadDocument } from '../services/documentProcessor';

interface DocumentUploaderProps {
  onFilesChange: (files: DocumentFile[]) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentFile>) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onError?: (message: string) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UploadProgress {
  filename: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onFilesChange,
  onUpdateDocument,
  onUploadStart,
  onUploadComplete,
  onError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

        // Update status to processing (AI is working)
        setUploadProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'processing' } : p
        ));

        // Add the uploaded document to the UI
        // Backend returns status: 'review' - AI is processing in background
        onFilesChange([uploadedDoc]);

        // Mark as complete after a short delay
        setTimeout(() => {
          setUploadProgress(prev => prev.map((p, idx) =>
            idx === i ? { ...p, status: 'complete' } : p
          ));
        }, 500);

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

    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
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
        return 'AI Processing...';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Failed';
    }
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
        {isUploading ? (
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
              className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-stone-200 dark:border-slate-700"
            >
              <div className="flex-shrink-0">
                {getStatusIcon(progress.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {progress.filename}
                </p>
                <p className={`text-xs ${
                  progress.status === 'error' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {progress.error || getStatusText(progress.status)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;