export interface DocumentFile {
  id: string;
  filename: string;
  displayName: string;
  category: string;
  uploadDate: Date;
  status: 'review' | 'complete';
  downloadUrl?: string;
  
  aiAnalysis?: {
    extractedText: string;
    category: string;
    structuredData: Record<string, any>;
  };
}

export type DocumentCategory = 
  | 'Lab Results'
  | 'Prescriptions'
  | 'Imaging Reports'
  | "Doctor's Notes"
  | 'Vaccination Records'
  | 'Other';

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