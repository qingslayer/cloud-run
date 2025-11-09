export interface DocumentFile {
  id: string;
  filename: string; // Original file name from upload
  name?: string; // Alias for filename (for compatibility)
  displayName: string | null; // AI-generated human-readable name
  category: string;
  fileType: string; // MIME type (e.g., 'application/pdf', 'image/jpeg')
  uploadDate: Date;
  status: 'review' | 'complete';
  downloadUrl?: string; // Signed URL for viewing/downloading (only in GET /:id)

  // AI analysis results (only present after analysis completes)
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

export type UniversalSearchResult =
  | { type: 'documents'; documents: DocumentFile[] }
  | { type: 'summary'; summary: string; referencedDocuments: DocumentFile[] }
  | { type: 'answer'; answer: string; referencedDocuments: DocumentFile[] }
  | { type: 'chat'; answer: string; sessionId: string; referencedDocuments: DocumentFile[] };