import React, { useRef, useState } from 'react';
import { DocumentFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { uploadDocument, analyzeDocument } from '../services/documentProcessor';

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
    const tempDocs: DocumentFile[] = [];

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`File type not supported: ${file.name} (${file.type}). Please upload PDF, JPG, or PNG files.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        alert(`File is too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is ${MAX_SIZE_MB} MB.`);
        continue;
      }
      
      const tempId = crypto.randomUUID();
      const newDoc: Partial<DocumentFile> = {
        id: tempId,
        filename: file.name,
        displayName: file.name,
        uploadDate: new Date(),
        category: 'Other',
        status: 'processing',
      };
      tempDocs.push(newDoc as DocumentFile);
      validFiles.push(file);
    }
    
    if (tempDocs.length > 0) {
      onFilesChange(tempDocs);
    }

    tempDocs.forEach(async (tempDoc, index) => {
      const file = validFiles[index];
      try {
        // Step 1: Upload the document to get the initial record from the backend
        const uploadedDoc = await uploadDocument(file, 'Other', file.name);
        
        // Update the temp doc with the real ID and data
        onUpdateDocument(tempDoc.id, { ...uploadedDoc, status: 'processing' } as Partial<DocumentFile>);
        const realId = uploadedDoc.id;

        // Step 2: Trigger the AI analysis
        const analyzedDoc = await analyzeDocument(realId);

        // Step 3: Update the document with the final, processed data
        onUpdateDocument(realId, { ...analyzedDoc, status: 'review' });

      } catch (error) {
        console.error("Error processing file:", file.name, error);
        onUpdateDocument(tempDoc.id, {
          status: 'error',
        });
      }
    });

    if(fileInputRef.current) {
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