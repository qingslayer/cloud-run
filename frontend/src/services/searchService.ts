import { apiRequest } from '../config/api';
import { UniversalSearchResult } from '../types';

/**
 * Search Service - Communicates with backend unified search endpoint
 */

/**
 * Process a universal search query
 * @param query - Search query
 * @returns {Promise<UniversalSearchResult>}
 */
export async function processUniversalSearch(
  query: string
): Promise<UniversalSearchResult> {
  const response = await apiRequest('/api/documents/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

  const data = await response.json();

  // Map backend response to frontend type
  switch (data.type) {
    case 'documents':
      return {
        type: 'documents',
        documents: data.results, // Backend uses 'results' field
        fallback: data.fallback,
        fallbackReason: data.fallbackReason,
      };

    case 'summary':
      return {
        type: 'summary',
        summary: data.summary,
        referencedDocuments: data.referencedDocuments,
        fallback: data.fallback,
        fallbackReason: data.fallbackReason,
      };

    case 'answer':
      return {
        type: 'answer',
        answer: data.answer,
        referencedDocuments: data.referencedDocuments,
        fallback: data.fallback,
        fallbackReason: data.fallbackReason,
      };

    case 'chat':
      return {
        type: 'chat',
        answer: data.answer,
        sessionId: data.sessionId,
        referencedDocuments: data.referencedDocuments,
        fallback: data.fallback,
        fallbackReason: data.fallbackReason,
      };

    default:
      throw new Error(`Unknown search result type: ${data.type}`);
  }
}
