import React, { useRef, useState } from 'react';
import { DocumentFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { extractTextFromDocument, extractStructuredData, analyzeAndCategorizeDocument } from '../services/documentProcessor';

interface DocumentUploaderProps {
  onFilesChange: (files: DocumentFile[]) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentFile>) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * In a real-world app, this function would handle the secure upload to Google Cloud Storage.
 * This entire process MUST happen over a secure HTTPS connection to ensure encryption in transit.
 * 1. It would call YOUR backend with the file details (name, type).
 * 2. Your backend would securely generate a short-lived "signed URL" for uploading.
 * 3. This function would use that URL to upload the file directly to GCS from the client.
 * 4. After the upload, it would return the file's unique identifier (e.g., GCS path).
 * This flow ensures client-side code never handles long-lived secret keys.
 */
const uploadFileToCloud = async (file: File): Promise<string> => {
  console.log(`Simulating upload for ${file.name}...`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  const fileIdentifier = `uploads/demo-user-01/${crypto.randomUUID()}-${file.name}`;
  console.log(`Simulated upload complete. File identifier: ${fileIdentifier}`);
  // In a real app, this identifier would be returned from your backend after confirming the upload.
  return fileIdentifier;
};


// This function is no longer needed client-side for uploads, but is kept for OCR processing.
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onFilesChange, onUpdateDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newDocuments: DocumentFile[] = [];
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`File type not supported: ${file.name} (${file.type}). Please upload PDF, JPG, or PNG files.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        alert(`File is too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is ${MAX_SIZE_MB} MB.`);
        continue;
      }
      
      const newDoc: DocumentFile = {
        id: crypto.randomUUID(),
        name: file.name,
        title: file.name, // Temporary title
        type: file.type,
        size: file.size,
        // The Base64 data is no longer stored here for the main file.
        // It will be replaced by a cloud storage URL/identifier.
        base64Data: '', // This will be used for AI processing only.
        previewUrl: URL.createObjectURL(file),
        uploadDate: new Date(),
        category: 'Other', // Temporary category
        userId: 'demo-user-01',
        extractedText: '',
        status: 'processing',
      };
      newDocuments.push(newDoc);
      validFiles.push(file);
    }
    
    if (newDocuments.length > 0) {
      onFilesChange(newDocuments);
    }

    newDocuments.forEach(async (doc, index) => {
      const file = validFiles[index];
      try {
        // Step 1: Securely upload the file to cloud storage (simulated).
        // The 'base64Data' field is now used as a placeholder for the cloud storage path/ID.
        const cloudFileIdentifier = await uploadFileToCloud(file);
        
        // Step 2: For AI processing, we still need the file content. 
        // We generate a Base64 string on-the-fly for the AI, but don't store it long-term in the main state.
        const processingBase64 = await fileToBase64(file);
        
        const extractedText = await extractTextFromDocument({ base64Data: processingBase64, type: file.type });
        
        const { title, category } = await analyzeAndCategorizeDocument(extractedText);

        const structuredData = await extractStructuredData({ ...doc, extractedText, title, category, base64Data: processingBase64 });
        
        // Step 3: Update the document with the final, processed data and its cloud identifier.
        onUpdateDocument(doc.id, {
          base64Data: cloudFileIdentifier, // Now this field stores the cloud path, not the file content.
          extractedText,
          title, 
          category,
          status: 'review',
          structuredData,
        });

      } catch (error) {
        console.error("Error processing file:", file.name, error);
        onUpdateDocument(doc.id, {
          status: 'error',
          extractedText: 'Failed to process this document.',
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