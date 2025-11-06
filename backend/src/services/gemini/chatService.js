import { ai, model } from './client.js';

/**
 * Chat Service for AI Assistant
 * Handles conversational interactions with document context
 */

/**
 * Create system instruction for chat
 * @param {Array} documents - User's documents with extracted text
 * @returns {string} System instruction
 */
function createSystemInstruction(documents) {
  const documentContext = documents
    .filter(doc => doc.extractedText)
    .map(doc => `--- DOCUMENT: ${doc.title} (Category: ${doc.category}) ---\n${doc.extractedText}\n--- END DOCUMENT ---`)
    .join('\n\n');

  return `You are a helpful, friendly, and supportive AI assistant for Health Vault. Your primary role is to analyze the user's health documents and answer their questions based *only* on the information provided in those documents.

--- DOCUMENT CONTEXT ---
${documentContext}
--- END DOCUMENT CONTEXT ---

**Core Instructions:**
1.  **Analyze and Synthesize:** When asked a question, find the relevant information within the document context provided above.
2.  **Be Clear and Conversational:** Provide clear, direct answers in a friendly tone. If information is not present, gently state that it's not available in the provided documents.
3.  **STRICTLY NO MEDICAL ADVICE:** Your purpose is to find and clarify information from the records. If asked for advice, opinions, or interpretations of data (e.g., "is this bad?"), you MUST gently decline and state, "I can't provide medical advice. Please consult a healthcare professional to discuss your results."
4.  **Stay On Topic:** If the user asks a general question not related to the documents, politely redirect them to ask about their records.
5.  **Excellent Formatting:** Structure your response clearly using standard markdown.
    - ALWAYS use a double newline (a blank line) to separate paragraphs.
    - For bullet points, start each line with an asterisk and a space (e.g., '* Item 1').
    - Use double asterisks for **bold text** and single asterisks for *italic text*.
    - Ensure there is a blank line before and after any list.`;
}

/**
 * Send a message in a chat session
 * @param {string} message - User message
 * @param {Array} documents - User's documents for context
 * @param {Array} history - Previous chat history
 * @returns {Promise<{text: string, history: Array}>}
 */
export async function sendChatMessage(message, documents = [], history = []) {
  const systemInstruction = createSystemInstruction(documents);

  try {
    // Create a chat session with history
    const chat = ai.chats.create({
      model,
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      config: {
        systemInstruction
      }
    });

    // Send the message
    const result = await chat.sendMessage({ message });
    const responseText = result.text;

    // Return response and updated history
    return {
      text: responseText,
      history: [
        ...history,
        { role: 'user', text: message },
        { role: 'model', text: responseText }
      ]
    };
  } catch (error) {
    console.error('Chat message failed:', error);
    throw new Error('Failed to process chat message: ' + error.message);
  }
}

