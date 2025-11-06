import { apiRequest } from '../config/api';
import { UniversalSearchResult } from '../types';

/**
 * Search Service - Communicates with backend AI search endpoint
 */

/**
 * Process a universal search query
 * @param query - Search query
 * @returns {Promise<UniversalSearchResult>}
 */
export async function processUniversalSearch(
  query: string
): Promise<UniversalSearchResult> {
  const response = await apiRequest('/api/ai/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  
  if (data.type === 'answer') {
    return {
      type: 'answer',
      answer: data.answer,
      sources: data.sources
    };
  } else {
    return {
      type: 'documents',
      documents: data.documents
    };
  }
}
