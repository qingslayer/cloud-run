import { DocumentFile, UniversalSearchResult } from '../types';
import { ai, model } from './ai';

const getDirectAnswerForSearch = async (query: string, documents: DocumentFile[]): Promise<{ answer: string; sources: DocumentFile[] }> => {
    const documentContext = documents
        .filter(file => file.status === 'complete' && file.extractedText)
        .map(file => `--- DOCUMENT: ${file.title} (Category: ${file.category}) ---\n${file.extractedText}\n--- END DOCUMENT ---`)
        .join('\n\n');

    const directPrompt = `You are a direct Q&A engine for a health app. Your task is to answer the user's question factually and concisely based *only* on the provided document context. 
    
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
            contents: { parts: [{ text: directPrompt }] },
        });
        // In a real app, we'd add logic to determine which documents were used as sources.
        // For now, we'll assume any document could be a source if an answer is found.
        return { answer: response.text, sources: documents.slice(0, 3) };
    } catch (error) {
        console.error('Gemini direct answer generation failed:', error);
        throw new Error('Failed to generate a direct answer.');
    }
};


export const processUniversalSearch = async (query: string, documents: DocumentFile[]): Promise<UniversalSearchResult> => {
    try {
        const { answer, sources } = await getDirectAnswerForSearch(query, documents);
        return { type: 'answer', answer, sources };
    } catch (error) {
        console.error("AI search processing failed:", error);
        throw error;
    }
};