/**
 * Document Analysis Pipeline
 * Centralized pipeline for analyzing documents with Gemini AI
 */

import {
  extractTextFromDocument,
  analyzeAndCategorizeDocument,
  extractStructuredData,
  generateSearchSummary
} from './documentProcessor.js';

/**
 * Run the complete document analysis pipeline
 * Extracts text, categorizes, extracts structured data, and generates summary
 *
 * @param {string} base64Data - Base64-encoded document data
 * @param {string} mimeType - MIME type of the document
 * @returns {Promise<Object>} Analysis results with displayName, category, and aiAnalysis
 * @throws {Error} If any step of the analysis fails
 */
export async function analyzeDocument(base64Data, mimeType) {
  try {
    // Step 1: Extract text from document
    const extractedText = await extractTextFromDocument(base64Data, mimeType);

    // Step 2: Analyze and categorize the document
    const categorization = await analyzeAndCategorizeDocument(extractedText);

    // Step 3: Extract structured data based on category
    const structuredData = await extractStructuredData(extractedText, categorization.category);

    // Step 4: Generate search summary
    const searchSummary = await generateSearchSummary(extractedText, categorization.category, structuredData);

    // Return standardized analysis results
    return {
      displayName: categorization.title,
      category: categorization.category,
      aiAnalysis: {
        category: categorization.category,
        structuredData: structuredData,
        searchSummary: searchSummary,  // Concise summary for efficient AI search
      },
    };
  } catch (error) {
    console.error('Document analysis pipeline failed:', error);
    throw new Error(`Failed to analyze document: ${error.message}`);
  }
}
