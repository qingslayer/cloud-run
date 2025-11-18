/**
 * Document Reference Matching Utilities
 * Centralized functions for matching AI-returned document references to actual documents
 */

/**
 * Match AI-returned document references to actual document objects
 * Tries multiple matching strategies: exact displayName, filename, ID, and fuzzy matching
 *
 * @param {Array} references - Array of document references (strings or objects) from AI
 * @param {Array} documents - Array of actual document objects to match against
 * @returns {Array} Array of matched document objects
 */
export function matchDocumentReferences(references, documents) {
  if (!references || !Array.isArray(references)) {
    console.warn('⚠️  Invalid or missing references array');
    return [];
  }

  const matchedDocs = [];
  const unmatchedRefs = [];

  console.log(`📋 Matching ${references.length} document references`);

  references.forEach(ref => {
    // Ref should be a string (displayName), but handle legacy object format too
    const refString = typeof ref === 'string' ? ref : (ref.displayName || ref.filename || ref.id);

    if (!refString) {
      console.warn('  ⚠️  Skipping invalid reference:', ref);
      unmatchedRefs.push(ref);
      return;
    }

    // Try multiple matching strategies
    let matchedDoc = null;

    // 1. Try exact displayName match (most common)
    matchedDoc = documents.find(d => d.displayName === refString);

    // 2. Try exact filename match
    if (!matchedDoc) {
      matchedDoc = documents.find(d => d.filename === refString);
    }

    // 3. Try ID match (if AI returned an ID string)
    if (!matchedDoc) {
      matchedDoc = documents.find(d => d.id === refString);
    }

    // 4. Try partial match (case-insensitive, substring)
    if (!matchedDoc) {
      const normalizedRef = refString.toLowerCase().trim();
      matchedDoc = documents.find(d =>
        d.displayName?.toLowerCase().includes(normalizedRef) ||
        normalizedRef.includes(d.displayName?.toLowerCase()) ||
        d.filename?.toLowerCase().includes(normalizedRef) ||
        normalizedRef.includes(d.filename?.toLowerCase())
      );
    }

    if (matchedDoc) {
      console.log(`  ✅ Matched: "${refString}" → ${matchedDoc.displayName}`);
      matchedDocs.push(matchedDoc);
    } else {
      console.warn(`  ❌ No match for: "${refString}"`);
      unmatchedRefs.push(refString);
    }
  });

  // Log summary
  console.log(`📊 Document matching: ${matchedDocs.length} matched, ${unmatchedRefs.length} unmatched`);

  if (unmatchedRefs.length > 0) {
    console.warn('⚠️  Available document names were:');
    documents.forEach(d => console.warn(`     - "${d.displayName}"`));
  }

  return matchedDocs;
}
