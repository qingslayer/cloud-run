/**
 * AI Context Building Utilities
 * Centralized functions for building document context for AI services
 */

/**
 * Build document context string for AI prompts
 * This creates a formatted context of documents including summaries and structured data
 *
 * @param {Array} documents - Array of document objects with aiAnalysis
 * @returns {string} Formatted document context string
 */
export function buildDocumentContext(documents) {
  return documents
    .map(doc => {
      const a = doc.aiAnalysis || {};

      // Build structured data string (for precise lookups)
      const structuredDataStr = a.structuredData && Object.keys(a.structuredData).length > 0
        ? Object.entries(a.structuredData)
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('\n')
        : null;

      // Build context from searchSummary (overview) + structuredData (precision)
      return `--- DOCUMENT: ${doc.displayName || doc.filename} ---
Summary: ${a.searchSummary || 'No summary available'}
${structuredDataStr ? '\nDetailed Values:\n' + structuredDataStr : ''}
--- END DOCUMENT ---`;
    })
    .join('\n\n');
}
