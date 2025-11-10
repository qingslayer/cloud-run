/**
 * Search Ranking Service
 *
 * Implements BM25-inspired relevance scoring to rank search results.
 * Scores documents based on:
 * - Term frequency (how often keywords appear)
 * - Field importance (matches in title worth more than in content)
 * - Document recency (newer documents get slight boost)
 * - Document completeness (complete status gets slight boost)
 */

/**
 * Field weights for scoring
 * Higher weight = more important for relevance
 */
const FIELD_WEIGHTS = {
  displayName: 10,      // Display name most important
  filename: 8,          // Original filename very important
  category: 6,          // Category quite important
  searchSummary: 5,     // AI summary important
  notes: 4,             // User notes moderately important
  structuredData: 2,    // Extracted data less important (more noisy)
};

/**
 * Calculate term frequency in text
 * @param {string} text - Text to search in
 * @param {string} term - Term to search for
 * @returns {number} Number of occurrences
 */
const calculateTermFrequency = (text, term) => {
  if (!text || !term) return 0;

  const normalizedText = text.toLowerCase();
  const normalizedTerm = term.toLowerCase();

  // Count occurrences
  let count = 0;
  let position = 0;

  while ((position = normalizedText.indexOf(normalizedTerm, position)) !== -1) {
    count++;
    position += normalizedTerm.length;
  }

  return count;
};

/**
 * Calculate field score for a document
 * @param {object} doc - Document to score
 * @param {array} keywords - Array of keyword groups (with synonyms)
 * @returns {number} Field-weighted score
 */
const calculateFieldScore = (doc, keywords) => {
  let totalScore = 0;
  const aiAnalysis = doc.aiAnalysis || {};

  // Define fields to search with their weights
  const fields = [
    { text: doc.displayName || '', weight: FIELD_WEIGHTS.displayName },
    { text: doc.filename || '', weight: FIELD_WEIGHTS.filename },
    { text: doc.category || '', weight: FIELD_WEIGHTS.category },
    { text: aiAnalysis.searchSummary || '', weight: FIELD_WEIGHTS.searchSummary },
    { text: doc.notes || '', weight: FIELD_WEIGHTS.notes },
    {
      text: aiAnalysis.searchableText || JSON.stringify(aiAnalysis.structuredData || {}),
      weight: FIELD_WEIGHTS.structuredData
    },
  ];

  // For each keyword group
  keywords.forEach(group => {
    let bestGroupScore = 0;

    // Find the best-matching synonym in this group
    group.forEach(term => {
      let termScore = 0;

      // Calculate term frequency across all fields
      fields.forEach(field => {
        const tf = calculateTermFrequency(field.text, term);
        if (tf > 0) {
          // Score = term frequency × field weight
          termScore += tf * field.weight;
        }
      });

      // Keep highest scoring synonym for this group
      bestGroupScore = Math.max(bestGroupScore, termScore);
    });

    totalScore += bestGroupScore;
  });

  return totalScore;
};

/**
 * Calculate recency score
 * More recent documents get a slight boost
 * @param {Date} uploadDate - Document upload date
 * @returns {number} Recency multiplier (1.0 to 1.2)
 */
const calculateRecencyScore = (uploadDate) => {
  if (!uploadDate) return 1.0;

  const now = new Date();
  const docDate = new Date(uploadDate);
  const daysSinceUpload = (now - docDate) / (1000 * 60 * 60 * 24);

  // Documents from last 30 days get up to 20% boost
  if (daysSinceUpload <= 30) {
    return 1.2;
  } else if (daysSinceUpload <= 90) {
    return 1.1;
  } else if (daysSinceUpload <= 365) {
    return 1.05;
  }

  return 1.0;
};

/**
 * Calculate document completeness score
 * Complete documents get slight boost
 * @param {string} status - Document status
 * @returns {number} Status multiplier (1.0 or 1.1)
 */
const calculateStatusScore = (status) => {
  return status === 'complete' ? 1.1 : 1.0;
};

/**
 * Score a single document for relevance
 * @param {object} doc - Document to score
 * @param {array} keywords - Array of keyword groups
 * @returns {number} Relevance score
 */
const scoreDocument = (doc, keywords) => {
  // Base score from term matching and field importance
  const fieldScore = calculateFieldScore(doc, keywords);

  // Multipliers
  const recencyMultiplier = calculateRecencyScore(doc.uploadDate);
  const statusMultiplier = calculateStatusScore(doc.status);

  // Final score
  const finalScore = fieldScore * recencyMultiplier * statusMultiplier;

  return finalScore;
};

/**
 * Score and rank an array of documents
 * @param {array} documents - Array of documents to rank
 * @param {array} keywords - Array of keyword groups
 * @returns {array} Documents sorted by relevance (highest first)
 */
const rankDocuments = (documents, keywords) => {
  if (!documents || documents.length === 0) {
    return [];
  }

  if (!keywords || keywords.length === 0) {
    // No keywords, just sort by date
    return documents.sort((a, b) => {
      const dateA = new Date(a.uploadDate);
      const dateB = new Date(b.uploadDate);
      return dateB - dateA;
    });
  }

  // Score each document
  const scoredDocs = documents.map(doc => ({
    ...doc,
    _relevanceScore: scoreDocument(doc, keywords),
  }));

  // Sort by score (descending), then by date (descending) as tiebreaker
  scoredDocs.sort((a, b) => {
    if (b._relevanceScore !== a._relevanceScore) {
      return b._relevanceScore - a._relevanceScore;
    }
    const dateA = new Date(a.uploadDate);
    const dateB = new Date(b.uploadDate);
    return dateB - dateA;
  });

  // Remove internal score field before returning
  return scoredDocs.map(doc => {
    const { _relevanceScore, ...docWithoutScore } = doc;
    return docWithoutScore;
  });
};

/**
 * Get top N documents by relevance
 * @param {array} documents - Array of documents
 * @param {array} keywords - Array of keyword groups
 * @param {number} limit - Maximum number of results
 * @returns {array} Top N documents
 */
const getTopDocuments = (documents, keywords, limit = 50) => {
  const ranked = rankDocuments(documents, keywords);
  return ranked.slice(0, limit);
};

export {
  scoreDocument,
  rankDocuments,
  getTopDocuments,
  // Export for testing
  calculateTermFrequency,
  calculateFieldScore,
  calculateRecencyScore,
  calculateStatusScore,
};
