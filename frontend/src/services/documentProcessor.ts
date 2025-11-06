import { apiRequest } from '../config/api';
import { DocumentCategory } from '../types';

/**
 * Document Processing Service - Communicates with backend AI processing endpoints
 */

export interface ProcessedDocumentResult {
  extractedText: string;
  title: string;
  category: DocumentCategory;
  structuredData: any;
  status: 'review';
}

/**
 * Process a document: extract text, categorize, and extract structured data
 * @param base64Data - Base64 encoded document data
 * @param mimeType - Document MIME type
 * @returns {Promise<ProcessedDocumentResult>}
 */
export async function processDocument(
  base64Data: string,
  mimeType: string
): Promise<ProcessedDocumentResult> {
  const response = await apiRequest('/api/ai/process-document', {
    method: 'POST',
    body: JSON.stringify({ base64Data, mimeType }),
  });

  return await response.json();
}

/**
 * Extract text from a document
 * @param base64Data - Base64 encoded document data
 * @param mimeType - Document MIME type
 * @returns {Promise<string>}
 */
export async function extractTextFromDocument(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const response = await apiRequest('/api/ai/extract-text', {
    method: 'POST',
    body: JSON.stringify({ base64Data, mimeType }),
  });

  const data = await response.json();
  return data.text;
}

/**
 * Analyze and categorize document text
 * @param text - Document text
 * @returns {Promise<{title: string, category: DocumentCategory}>}
 */
export async function analyzeAndCategorizeDocument(
  text: string
): Promise<{ title: string; category: DocumentCategory }> {
  const response = await apiRequest('/api/ai/categorize', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

  return await response.json();
}

/**
 * Extract structured data from document text
 * @param text - Document text
 * @param category - Document category
 * @returns {Promise<any>}
 */
export async function extractStructuredData(
  text: string,
  category: DocumentCategory
): Promise<any> {
  const response = await apiRequest('/api/ai/extract-structured-data', {
    method: 'POST',
    body: JSON.stringify({ text, category }),
  });

  return await response.json();
}
