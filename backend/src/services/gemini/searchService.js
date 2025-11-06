import { ai, model } from './client.js';

/**
 * Search Service
 * AI-powered search across user documents
 */

/**
 * Process a natural language search query
 * @param {string} query - User's search query
 * @param {Array} documents - User's documents to search
 * @returns {Promise<{answer: string, sources: Array}>}
 */
export async function processSearchQuery(query, documents = []) {
  const documentContext = documents
    .filter(doc => doc.extractedText)
    .map(doc => `--- DOCUMENT: ${doc.title} (Category: ${doc.category}) ---\n${doc.extractedText}\n--- END DOCUMENT ---`)
    .join('\n\n');

  const prompt = `You are a direct Q&A engine for a health app. Your task is to answer the user's question factually and concisely based *only* on the provided document context. 
    
**Formatting Rules:**
- Structure your answer clearly. Use markdown lists (e.g., "- Item: value") for test results or medications.
- Use bolding for emphasis on key terms (e.g., "**White Blood Cells (WBC):**").
- Do NOT use any conversational filler, greetings, or sign-offs (e.g., no "Hello there!", no "Please remember..."). Just provide the factual answer.
- If the answer is not in the documents, state that clearly.

--- DOCUMENT CONTEXT ---
${documentContext}
--- END DOCUMENT CONTEXT ---

**Question:** "${query}"

**Factual Answer:**`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    });
    const answerText = response.text;

    // Return answer with source documents
    // In a more sophisticated implementation, we could identify which specific documents were used
    return {
      answer: answerText,
      sources: documents.slice(0, 3).map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category
      }))
    };
  } catch (error) {
    console.error('Search query processing failed:', error);
    throw new Error('Failed to process search query: ' + error.message);
  }
}

/**
 * Determine if a query should use AI search
 * @param {string} query - Search query
 * @returns {boolean}
 */
export function shouldUseAISearch(query) {
  const lowerCaseQuery = query.toLowerCase().trim();

  // Question indicators
  if (lowerCaseQuery.endsWith('?')) return true;

  const QUESTION_WORDS = ['what', 'who', 'when', 'where', 'why', 'how', 'is', 'are', 'can', 'do', 'does', 'show me'];
  const words = lowerCaseQuery.split(' ');
  if (QUESTION_WORDS.includes(words[0])) return true;

  // Interpretation keywords
  const INTERPRETATION_KEYWORDS = ['results', 'summary', 'details', 'values', 'normal', 'meaning', 'findings', 'impression'];
  if (INTERPRETATION_KEYWORDS.some(keyword => lowerCaseQuery.includes(keyword))) return true;

  // Contains medical abbreviations (all caps)
  if (words.some(word => word.length > 2 && word === word.toUpperCase())) return true;

  return false;
}

