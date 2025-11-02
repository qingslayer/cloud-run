export type DocumentCategory = 
  | 'Lab Results'
  | 'Prescriptions'
  | 'Imaging Reports'
  | "Doctor's Notes"
  | 'Vaccination Records'
  | 'Other';

export interface DocumentFile {
  id: string;
  name: string;
  title: string;
  type: string;
  size: number;
  base64Data: string;
  previewUrl: string;
  uploadDate: Date;
  category: DocumentCategory;
  userId: string;
  extractedText: string;
  status: 'processing' | 'review' | 'complete' | 'error';
  structuredData?: any;
  userNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export type Theme = 'light' | 'dark' | 'system';

export type View = 'dashboard' | 'records' | 'settings' | 'search';

export type UniversalSearchResult = {
  type: 'documents' | 'answer';
  documents?: DocumentFile[];
  answer?: string;
  sources?: DocumentFile[];
};