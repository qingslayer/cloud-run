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
    .map(doc => {
      const a = doc.aiAnalysis || {};
      const keyFindings = (a.keyFindings || []).map(f => `- ${f.finding}: ${f.result}`).join('\n');
      return `--- DOCUMENT: ${doc.displayName} (Category: ${doc.category}) ---\nSummary: ${a.summary}\nProvider: ${a.provider}\nKey Findings:\n${keyFindings}\n--- END DOCUMENT ---`;
    })
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

export async function getAISummary(query, documents = []) {
  const documentContext = documents
    .map(doc => {
      const a = doc.aiAnalysis || {};
      const keyFindings = (a.keyFindings || []).map(f => `- ${f.finding}: ${f.result}`).join('\n');
      return `--- DOCUMENT: ${doc.displayName} (Category: ${doc.category}) ---\nSummary: ${a.summary}\nProvider: ${a.provider}\nKey Findings:\n${keyFindings}\n--- END DOCUMENT ---`;
    })
    .join('\n\n');

  const prompt = `You are a health document summarization engine. Your task is to provide a concise, high-level overview based on the user's query and the provided document context. Identify the most relevant documents and synthesize their key findings into a brief summary.

--- DOCUMENT CONTEXT ---
${documentContext}
--- END DOCUMENT CONTEXT ---

**User Query:** "${query}"

**Instructions:**
1.  **Identify Relevant Documents:** First, determine which of the provided documents are most relevant to the user's query.
2.  **Generate a Concise Summary:** Based on the relevant documents, write a 1-3 sentence summary that directly addresses the user's query.
3.  **List Key Documents:** List the top 3-5 most relevant documents with their display name and category.
4.  **Suggest Follow-up Questions:** Provide 2-3 insightful follow-up questions the user might have.
5.  **Format the Output:** Return a JSON object with the following structure: { "summary": "...", "documents": [{"id": "...", "displayName": "...", "category": "..."}], "suggestedFollowUps": ["...", "..."] }. The documents should be the full document objects, not just the IDs. Make sure the JSON is valid.

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

