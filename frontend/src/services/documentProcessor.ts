import { apiRequest, apiFormRequest } from '../config/api';
import { DocumentFile } from '../types';

/**
 * Document Processing and Management Service
 * Communicates with all backend document-related endpoints
 */

// Helper to ensure date strings from the API are converted to Date objects
const parseDocumentDates = (doc: any): DocumentFile => ({
  ...doc,
  uploadDate: new Date(doc.uploadDate),
  reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt) : undefined,
  aiAnalysis: doc.aiAnalysis ? {
    ...doc.aiAnalysis,
  } : undefined,
});

// ============================================================================
// Document CRUD Operations
// ============================================================================

/**
 * Uploads a file to the backend.
 * @param file - The File object to upload.
 * @param category - Optional category for the document.
 * @param name - Optional name for the document.
 * @returns The metadata of the uploaded document.
 */
export async function uploadDocument(file: File, category?: string, name?: string): Promise<DocumentFile> {
  const formData = new FormData();
  formData.append('file', file);
  if (category) {
    formData.append('category', category);
  }
  if (name) {
    formData.append('name', name);
  }

  const response = await apiFormRequest('/api/documents/upload', formData);
  const data = await response.json();
  return parseDocumentDates(data);
}

/**
 * Fetches a list of documents from the backend.
 * @param category - Optional category to filter by.
 * @param limit - Optional limit for pagination.
 * @param offset - Optional offset for pagination.
 * @returns An object containing the list of documents and total count.
 */
export async function getDocuments(
  category?: string | 'all',
  limit?: number,
  offset?: number
): Promise<{ documents: DocumentFile[]; total: number }> {
  const params = new URLSearchParams();
  if (category && category !== 'all') {
    params.append('category', category);
  }
  if (limit) {
    params.append('limit', limit.toString());
  }
  if (offset) {
    params.append('offset', offset.toString());
  }

  const response = await apiRequest(`/api/documents?${params.toString()}`);
  const data = await response.json();
  return {
    ...data,
    documents: data.documents.map(parseDocumentDates),
  };
}

/**
 * Fetches a single document with its details and a download URL.
 * @param id - The ID of the document to fetch.
 * @returns The full document object.
 */
export async function getDocument(id: string): Promise<DocumentFile> {
  const response = await apiRequest(`/api/documents/${id}`);
  const data = await response.json();
  return parseDocumentDates(data);
}

/**
 * Updates a document's metadata.
 * @param id - The ID of the document to update.
 * @param updates - An object with the fields to update.
 * @returns The updated document object.
 */
export async function updateDocument(id: string, updates: Partial<DocumentFile>): Promise<DocumentFile> {
  const response = await apiRequest(`/api/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  return parseDocumentDates(data);
}

/**
 * Deletes a document from the backend.
 * @param id - The ID of the document to delete.
 * @returns A success response.
 */
export async function deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest(`/api/documents/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
}

// ============================================================================
// AI-Powered Document Analysis
// ============================================================================

/**
 * Triggers the full AI analysis pipeline for a document.
 * @param id - The ID of the document to analyze.
 * @returns The updated document object with analysis results.
 */
export async function analyzeDocument(id: string): Promise<DocumentFile> {
  const response = await apiRequest(`/api/documents/${id}/analyze`, {
    method: 'POST',
  });
  const data = await response.json();
  return parseDocumentDates(data);
}
