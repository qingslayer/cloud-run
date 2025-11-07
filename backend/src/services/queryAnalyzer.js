const ACTION_WORDS = ['show', 'list', 'find', 'get', 'display', 'give me'];
const CATEGORY_WORDS = {
  'lab-result': ['lab', 'labs', 'blood work', 'blood test'],
  'prescription': ['prescription', 'prescriptions', 'medication', 'medications'],
  'imaging-report': ['imaging', 'x-ray', 'mri', 'ct scan'],
  'insurance': ['insurance', 'coverage'],
  'consultation': ['consultation', 'doctor note', 'note'],
  'vaccine': ['vaccine', 'vaccination'],
};
const QA_WORDS = ['what', 'when', 'where', 'who'];
const CHAT_WORDS = ['why', 'how', 'should', 'explain', 'summarize'];

/**
 * Analyzes the search query to determine its type and extract parameters.
 * @param {string} query - The user's search query.
 * @returns {{type: "documents" | "summary" | "answer" | "chat", category: string|null, keywords: string[], timeRange: any|null, confidence: number}}
 */
export function analyzeQuery(query) {
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);

  // Check for chat queries
  if (CHAT_WORDS.some(word => normalizedQuery.startsWith(word))) {
    return { type: 'chat', category: null, keywords: words, timeRange: null, confidence: 0.9 };
  }

  // Check for answer queries
  if (QA_WORDS.some(word => normalizedQuery.startsWith(word))) {
    return { type: 'answer', category: null, keywords: words, timeRange: null, confidence: 0.9 };
  }

  // Check for simple documents queries
  const hasActionWord = ACTION_WORDS.some(word => normalizedQuery.includes(word));
  const foundCategory = Object.keys(CATEGORY_WORDS).find(cat => 
    CATEGORY_WORDS[cat].some(word => normalizedQuery.includes(word))
  );

  if (hasActionWord && foundCategory) {
    return { type: 'documents', category: foundCategory, keywords: [], timeRange: null, confidence: 0.95 };
  }

  // Default to summary for medical-like terms
  // This is a simple heuristic, a more advanced model could be used here
  if (words.length <= 3) { // Assume short queries with medical terms are for summaries
    return { type: 'summary', category: null, keywords: words, timeRange: null, confidence: 0.7 };
  }

  // Fallback to chat for more complex queries
  return { type: 'chat', category: null, keywords: words, timeRange: null, confidence: 0.6 };
}
