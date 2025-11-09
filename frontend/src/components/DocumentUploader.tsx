import React, { useRef, useState } from 'react';
import { DocumentFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { uploadDocument } from '../services/documentProcessor';

interface DocumentUploaderProps {
  onFilesChange: (files: DocumentFile[]) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentFile>) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onFilesChange, onUpdateDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];

    // Validate files first
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`File type not supported: ${file.name} (${file.type}). Please upload PDF, JPG, or PNG files.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        alert(`File is too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is ${MAX_SIZE_MB} MB.`);
        continue;
      }
      validFiles.push(file);
    }

    // Upload each valid file
    for (const file of validFiles) {
      try {
        console.log(`Uploading ${file.name}...`);

        // Upload to backend - backend will auto-trigger AI analysis
        const uploadedDoc = await uploadDocument(file, 'Other', file.name);

        console.log(`Upload successful: ${uploadedDoc.id}, status: ${uploadedDoc.status}`);

        // Add the uploaded document to the UI
        // Backend returns status: 'review' - AI is processing in background
        onFilesChange([uploadedDoc]);

      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    // Clear the file input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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


  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`group relative block w-full rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer ${
        isDragging
          ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/30'
          : 'border-gray-300/70 dark:border-gray-700/70 hover:border-sky-500/80 dark:hover:border-sky-500/60 hover:bg-white/30 dark:hover:bg-black/10'
      }`}
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
        accept="image/png, image/jpeg, application/pdf"
      />
      <UploadIcon className={`mx-auto h-10 w-10 transition-colors duration-300 ${isDragging ? 'text-sky-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-sky-500'}`} />
      <span className={`mt-2 block text-sm font-semibold transition-colors duration-300 ${isDragging ? 'text-sky-500 dark:text-sky-300' : 'text-gray-900 dark:text-gray-300 group-hover:text-sky-600 dark:group-hover:text-sky-400'}`}>
        Upload Documents
      </span>
      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
        PDF, JPG, PNG up to 10MB
      </span>
    </div>
  );
};

export default DocumentUploader;