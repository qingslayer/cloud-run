const ACTION_WORDS = ['show', 'list', 'find', 'get', 'display', 'give me'];
const CATEGORY_WORDS = {
  'lab-result': ['lab', 'labs', 'blood work', 'blood test', 'test result'],
  'prescription': ['prescription', 'prescriptions', 'medication', 'medications', 'drug', 'drugs'],
  'imaging-report': ['imaging', 'x-ray', 'mri', 'ct scan', 'ultrasound', 'scan'],
  'doctor-note': ['consultation', 'doctor note', 'note', 'visit', 'appointment'],
  'vaccination': ['vaccine', 'vaccination', 'immunization', 'shot'],
  'other': ['document', 'file', 'record'],
};
const QUESTION_WORDS = ['what', 'when', 'where', 'who', 'why', 'how', 'should', 'explain'];

// Medical terminology synonym map - helps match user queries to document content
const SYNONYM_MAP = {
  "blood work": ["complete blood count", "cbc", "blood test", "hemogram"],
  "blood test": ["complete blood count", "cbc", "blood work", "hemogram"],
  "cholesterol": ["lipid panel", "cholesterol test", "lipids", "ldl", "hdl"],
  "xray": ["x-ray", "radiograph", "imaging report", "radiology"],
  "x-ray": ["xray", "radiograph", "imaging report", "radiology"],
  "mri": ["magnetic resonance imaging", "mri scan", "imaging"],
  "ct scan": ["computed tomography", "cat scan", "ct", "imaging"],
  "prescription": ["medication", "meds", "rx", "drug", "drugs", "medicine"],
  "medication": ["prescription", "meds", "rx", "drug", "drugs", "medicine"],
  "checkup": ["physical", "exam", "doctor visit", "annual", "appointment"],
};

// Map internal category names to Firestore document categories
const CATEGORY_MAP = {
  'lab-result': 'Lab Results',
  'prescription': 'Prescriptions',
  'imaging-report': 'Imaging Reports',
  'doctor-note': "Doctor's Notes",
  'vaccination': 'Vaccination Records',
  'other': 'Other',
};

/**
 * Parse time/date filters from the query.
 * @param {string} query - The user's search query.
 * @returns {{type: string, value: any}|null} - Time range object or null if no time filter found.
 */
function parseTimeFilter(query) {
  const lowerQuery = query.toLowerCase();
  const now = new Date();

  // "recent" = last 90 days
  if (lowerQuery.includes('recent')) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return { type: 'after', value: ninetyDaysAgo };
  }

  // "last year" = previous calendar year
  if (lowerQuery.includes('last year')) {
    const lastYear = now.getFullYear() - 1;
    return { type: 'year', value: lastYear };
  }

  // Specific year like "2023" or "from 2023"
  const yearMatch = lowerQuery.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (lowerQuery.includes(`from ${year}`)) {
      return { type: 'yearFrom', value: year };
    }
    return { type: 'year', value: year };
  }

  // "last N months" = relative months
  const monthsMatch = lowerQuery.match(/last (\d+) months?/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - months);
    return { type: 'after', value: targetDate };
  }

  return null;
}

/**
 * Extract keywords with synonym expansion.
 * @param {string} query - The cleaned query text (after removing time/category filters).
 * @returns {string[][]} - Array of keyword groups (each group contains synonyms).
 */
function extractKeywords(query) {
  let remainingQuery = query.toLowerCase();
  const keywordGroups = [];

  // Remove question words and action words - they're not content to search for
  const wordsToRemove = [...QUESTION_WORDS, ...ACTION_WORDS, 'my', 'the', 'a', 'an', 'is', 'are', 'was', 'were'];
  wordsToRemove.forEach(word => {
    // Use word boundaries to avoid partial matches
    remainingQuery = remainingQuery.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
  });

  // Sort synonym keys by length (longest first) to match phrases before individual words
  const sortedSynonymKeys = Object.keys(SYNONYM_MAP).sort((a, b) => b.length - a.length);

  sortedSynonymKeys.forEach(key => {
    if (remainingQuery.includes(key)) {
      keywordGroups.push([key, ...SYNONYM_MAP[key]]);
      remainingQuery = remainingQuery.replace(new RegExp(key, 'g'), ' ');
    }
  });

  // Add remaining individual keywords (only if length > 2)
  const remainingKeywords = remainingQuery.trim().split(/\s+/).filter(kw => kw.length > 2);
  remainingKeywords.forEach(kw => {
    keywordGroups.push([kw]);
  });

  return keywordGroups;
}

/**
 * Analyzes the search query to determine its type and extract parameters.
 *
 * SIMPLIFIED CLASSIFICATION LOGIC:
 * 1. Questions (?, what, when, why, how, etc.) → ANSWER (AI)
 * 2. Action words (show, list, find, etc.) → SUMMARY (AI search & summarize)
 * 3. Everything else → DOCUMENTS (fast, no AI)
 *
 * @param {string} query - The user's search query.
 * @returns {{type: "documents" | "summary" | "answer", category: string|null, keywords: string[][], timeRange: any|null, confidence: number}}
 */
export function analyzeQuery(query) {
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);

  // Parse time filter first
  const timeRange = parseTimeFilter(normalizedQuery);

  // Extract category if present
  let queryForAnalysis = normalizedQuery;
  let foundCategory = null;

  // Remove time-related phrases from query for further analysis
  if (timeRange) {
    queryForAnalysis = queryForAnalysis
      .replace(/recent|last year|from \d{4}|last \d+ months?|\b(20\d{2})\b/g, '')
      .trim();
  }

  // Check for category keywords
  const categoryKey = Object.keys(CATEGORY_WORDS).find(cat =>
    CATEGORY_WORDS[cat].some(word => queryForAnalysis.includes(word))
  );
  if (categoryKey) {
    foundCategory = CATEGORY_MAP[categoryKey];
    // Remove category words from query for keyword extraction
    CATEGORY_WORDS[categoryKey].forEach(word => {
      queryForAnalysis = queryForAnalysis.replace(new RegExp(word, 'g'), ' ');
    });
  }

  // Extract keywords with synonym expansion (for AI filtering)
  const keywords = extractKeywords(queryForAnalysis);

  // ============================================
  // SIMPLIFIED CLASSIFICATION (3 TYPES ONLY)
  // ============================================

  // 1. QUESTIONS → ANSWER (AI-powered Q&A)
  const hasQuestionMark = query.trim().endsWith('?');
  const startsWithQuestionWord = QUESTION_WORDS.some(word => normalizedQuery.startsWith(word));

  if (hasQuestionMark || startsWithQuestionWord) {
    return { type: 'answer', category: foundCategory, keywords, timeRange, confidence: 0.95 };
  }

  // 2. ACTION WORDS → SUMMARY (AI search & summarize)
  const hasActionWord = ACTION_WORDS.some(word => normalizedQuery.includes(word));

  if (hasActionWord) {
    return { type: 'summary', category: foundCategory, keywords, timeRange, confidence: 0.9 };
  }

  // 3. DEFAULT → DOCUMENTS (fast search, no AI)
  // This includes:
  // - Category keywords alone: "blood work", "prescriptions"
  // - Category + time: "recent labs", "2023 imaging"
  // - Document names: "Complete Blood Count"
  return { type: 'documents', category: foundCategory, keywords, timeRange, confidence: 0.8 };
}
