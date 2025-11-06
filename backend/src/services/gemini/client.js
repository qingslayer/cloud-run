import { GoogleGenAI } from '@google/genai';

/**
 * Gemini AI Client - Secure server-side only
 * NEVER expose API keys to the frontend
 */

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

// Initialize Gemini AI client (using the new @google/genai package)
export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

// Model to use
export const model = 'gemini-2.0-flash-exp';

/**
 * Health check for Gemini API
 * @returns {Promise<boolean>} True if API is accessible
 */
export async function healthCheck() {
  try {
    const result = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: 'test' }] }
    });
    return !!result;
  } catch (error) {
    console.error('Gemini API health check failed:', error);
    return false;
  }
}

