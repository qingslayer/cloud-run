import { ai, model } from './client.js';
import { MEDICAL_TERMINOLOGY_GUIDE } from './medicalTerminology.js';

/**
 * Search Service
 * AI-powered search across user documents
 */

/**
 * Process a natural language search query
 * @param {string} query - User's search query
 * @param {Array} documents - User's documents to search
 * @returns {Promise<{answer: string, referencedDocuments: Array}>}
 */
export async function getAIAnswer(query, documents = []) {
  const documentContext = documents
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

  const prompt = `You are a health records assistant for a personal health app. Your task is to answer the user's question factually and concisely based *only* on the provided document context.

**MEDICAL SAFETY - CRITICAL RULES:**

1. **You are NOT a medical professional** and cannot provide medical advice, diagnoses, or treatment recommendations.

2. **Emergency Detection**: If the user's question mentions urgent/emergency symptoms (chest pain, difficulty breathing, severe bleeding, suicidal thoughts, loss of consciousness, severe allergic reaction), include this in your answer:
   "If this is a medical emergency, please call emergency services or go to the nearest emergency room immediately."

3. **No Medical Advice or Interpretation**:
   - If asked "should I...", "what does this mean for my health?", "is this serious?", respond with: "I can show you what's in your records, but I cannot provide medical interpretation or advice. Please consult your healthcare provider for medical guidance."
   - If a document contains a medical professional's interpretation, quote it directly with attribution: "According to [Document Name], Dr. [Name] noted: [exact quote]"
   - NEVER add your own medical implications, diagnoses, treatment recommendations, or clinical interpretations
   - NEVER provide unsolicited trends, patterns, or insights unless explicitly asked

**MAKING INFORMATION USEFUL - BALANCE RULES:**

While you cannot provide medical advice, you SHOULD make the information understandable:

1. **Translate Medical Jargon**: When presenting test results, briefly explain what each test measures in 1 simple sentence.
   - Example: "ALT (Alanine Aminotransferase) is a liver enzyme that indicates liver function. Your level was 100.50 U/L (reference range: 10-49), which is above the reference range."

2. **Reference Range Context**: Always present values with their reference ranges and note whether they're within range, above, or below - but do NOT interpret what this means clinically.
   - Use neutral language: "above/below the reference range" (not "concerning" or "problematic")
   - Example: "Your Total Cholesterol was 250 mg/dL (reference: < 200), which is above the reference range."

3. **Organize by Category**: Group related tests together (e.g., "Lipid Profile", "Complete Blood Count") rather than listing everything in one bullet list.

4. **Plain Language Summary**: Start with a brief overview sentence before listing specific values.
   - Example: "Based on your blood work from December 2, 202X, here's what was tested:"

5. **Important Disclaimer**: Always include at the end: "I can show you what's in your records, but I cannot provide medical interpretation or advice. Please consult your healthcare provider for medical guidance."

${MEDICAL_TERMINOLOGY_GUIDE}

--- DOCUMENT CONTEXT ---
${documentContext}
--- END DOCUMENT CONTEXT ---

**User Question:** "${query}"

**CRITICAL: Determine Query Specificity**

First, classify the user's query as either GENERAL or SPECIFIC:

**GENERAL queries** are broad overview questions:
- Examples: "how's my blood work", "show me my labs", "what tests have I had", "my recent results", "blood work summary"
- Intent: User wants to know WHAT documents/tests exist, not detailed values

**SPECIFIC queries** ask about particular tests, values, or conditions:
- Examples: "what was my cholesterol", "show me liver enzymes", "my hemoglobin level", "ALT results", "what's my glucose"
- Intent: User wants detailed information about a specific measurement

**Instructions Based on Query Type:**

**FOR GENERAL QUERIES - Use "Librarian" Format (Document Summary):**

Provide a concise overview WITHOUT listing individual test values:

1. List the number and dates of relevant documents
2. Mention what types of tests were performed (categories only)
3. Optionally note if some values were outside reference ranges (without listing which ones)
4. Encourage user to ask for specific details

Example response:
"I found 3 blood work documents in your records:

• Comprehensive Metabolic Panel (CMP) - December 2, 202X
• Lipid Profile - December 2, 202X
• Complete Blood Count (CBC) - December 2, 202X and February 10, 2014

These tests covered liver function, kidney function, cholesterol levels, and blood cell counts. Some values were outside their reference ranges.

If you'd like details on any specific test or value, just ask! I can show you what's in your records, but I cannot provide medical interpretation or advice. Please consult your healthcare provider for medical guidance."

**FOR SPECIFIC QUERIES - Use "Encyclopedia" Format (Detailed Values):**

Provide detailed information about the requested test(s):

1. Explain what each test measures in 1 simple sentence
2. Show the value with its unit
3. Show the reference range
4. Note if it's within/above/below range using neutral language

Example response:
"**Cholesterol Results from December 2, 202X:**

• **Total Cholesterol** measures the total amount of cholesterol in your blood. Your level was 250 mg/dL (reference: < 200), which is above the reference range.

• **LDL Cholesterol** measures "bad" cholesterol that can build up in arteries. Your level was 190 mg/dL (reference: < 100), which is above the reference range.

• **HDL Cholesterol** measures "good" cholesterol that helps remove other cholesterol. Your level was 50 mg/dL (reference: > 40), which is above the minimum reference range.

• **Triglycerides** measures a type of fat in your blood. Your level was 100 mg/dL (reference: < 150), which is within the reference range.

I can show you what's in your records, but I cannot provide medical interpretation or advice. Please consult your healthcare provider for medical guidance."

**Additional Guidelines:**

- **Document Referencing:** When asked about "latest" or "most recent", identify the document with the most recent date
- **Temporal Comparisons:** Explicitly state dates: "Your [value] was X on [date] compared to Y on [earlier date]"
- **Multiple Documents:** If multiple documents match, mention all with dates
- **Cite Your Sources:** Include specific document(s) that contain the answer in referencedDocuments

**Edge Cases:**
- **No relevant information**: "I couldn't find information about [topic] in your uploaded records."
- **Conflicting information**: "I found conflicting information: [Document A] shows [value], while [Document B] shows [different value]."
- **Incomplete data**: "The [document name] contains partial information about [topic], but [specific detail] isn't clearly stated."

**CRITICAL - Format the Output:**

Return a JSON object with exactly these fields:
- "answer": Your response text (string)
- "referencedDocuments": An array of document display names (strings) that you referenced in your answer

**IMPORTANT:** For referencedDocuments, return ONLY the document display names as strings, exactly as they appear in the "DOCUMENT:" lines above. For example:
- If you used "--- DOCUMENT: Comprehensive Metabolic Panel (CMP) - December 2, 202X ---", return "Comprehensive Metabolic Panel (CMP) - December 2, 202X"
- Do NOT return full document objects with Summary/Detailed Values
- Do NOT make up new names
- Do NOT include documents you didn't actually reference

Example output:
{
  "answer": "I found 4 blood work documents...",
  "referencedDocuments": ["Comprehensive Metabolic Panel (CMP) - December 2, 202X", "Lipid Profile for Yash M. Patel - December 2, 202X"]
}

Do NOT include "suggestedFollowUps".

**JSON Response:**`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    });
    try {
      // Extract JSON from markdown code block if present
      const jsonRegex = /```json\n([\s\S]*?)\n```/;
      const match = response.text.match(jsonRegex);
      const jsonString = match ? match[1] : response.text;

      const jsonResponse = JSON.parse(jsonString);

      // The AI should return document references as displayName strings
      // We need to map them back to the full document objects from our input
      if (jsonResponse.referencedDocuments && Array.isArray(jsonResponse.referencedDocuments)) {
        const matchedDocs = [];
        const unmatchedRefs = [];

        console.log(`📋 AI returned ${jsonResponse.referencedDocuments.length} document references`);

        jsonResponse.referencedDocuments.forEach(ref => {
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

        jsonResponse.referencedDocuments = matchedDocs;
      } else {
        console.warn('⚠️  AI response missing referencedDocuments array');
        jsonResponse.referencedDocuments = [];
      }

      return jsonResponse;
    } catch (e) {
      console.error('Error parsing AI answer JSON:', e);
      console.error('AI Response Text:', response.text);
      throw new Error('Failed to parse AI answer response.');
    }
  } catch (error) {
    console.error('AI answer generation failed:', error);
    throw new Error('Failed to generate AI answer: ' + error.message);
  }
}


export async function getAISummary(query, documents = []) {
  const documentContext = documents
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

  const prompt = `You are a health document summarization assistant. Your task is to provide a concise, high-level overview based on the user's query and the provided document context. Identify the most relevant documents and synthesize their key findings into a brief summary.

**MEDICAL SAFETY - CRITICAL RULES:**

1. **You are NOT a medical professional** and cannot provide medical advice, diagnoses, or treatment recommendations.

2. **No Medical Interpretation**:
   - Present only what is explicitly stated in the documents
   - If a document contains a medical professional's interpretation, quote it directly with attribution
   - NEVER add your own medical context, significance, implications, or interpretations
   - NEVER provide unsolicited trends, patterns, or insights unless explicitly asked

${MEDICAL_TERMINOLOGY_GUIDE}

--- DOCUMENT CONTEXT ---
${documentContext}
--- END DOCUMENT CONTEXT ---

**User Query:** "${query}"

**Instructions:**

1. **Identify Relevant Documents:** Determine which of the provided documents are most relevant to the user's query.

2. **Document Referencing:**
   - When the query implies "latest" or "most recent", prioritize documents with the most recent dates
   - For queries about trends or comparisons, identify documents across different time periods

3. **Generate a Concise Summary:** Based on the relevant documents, write a 1-3 sentence summary that directly addresses the user's query. Present information factually without interpretation.

4. **List Key Documents:** List the top 3-5 most relevant documents with their display name and category.

5. **Edge Cases:**
   - **No relevant information**: "I couldn't find information about [topic] in your uploaded records. Please refine your search or check if the document has been uploaded."
   - **Conflicting information**: Note the conflict in your summary
   - **Incomplete data**: Note what information is partial or unclear

6. **Format the Output:** Return a JSON object with the following structure: { "summary": "...", "referencedDocuments": [{"id": "...", "displayName": "...", "category": "..."}] }. The referencedDocuments should be the full document objects, not just the IDs. Do NOT include "suggestedFollowUps". Make sure the JSON is valid.

**JSON Response:**`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    });
    try {
      // Extract JSON from markdown code block if present
      const jsonRegex = /```json\n([\s\S]*?)\n```/;
      const match = response.text.match(jsonRegex);
      const jsonString = match ? match[1] : response.text;

      const jsonResponse = JSON.parse(jsonString);

      // The AI should return document references as displayName strings
      // We need to map them back to the full document objects from our input
      if (jsonResponse.referencedDocuments && Array.isArray(jsonResponse.referencedDocuments)) {
        const matchedDocs = [];
        const unmatchedRefs = [];

        console.log(`📋 AI returned ${jsonResponse.referencedDocuments.length} document references`);

        jsonResponse.referencedDocuments.forEach(ref => {
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

        jsonResponse.referencedDocuments = matchedDocs;
      } else {
        console.warn('⚠️  AI response missing referencedDocuments array');
        jsonResponse.referencedDocuments = [];
      }

      return jsonResponse;
    } catch (e) {
      console.error('Error parsing AI summary JSON:', e);
      console.error('AI Response Text:', response.text);
      throw new Error('Failed to parse AI summary response.');
    }
  } catch (error) {
    console.error('AI summary generation failed:', error);
    throw new Error('Failed to generate AI summary: ' + error.message);
  }
}
