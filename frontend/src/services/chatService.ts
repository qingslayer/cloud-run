import { apiRequest } from '../config/api';
import { ChatMessage } from '../types';

/**
 * Chat Service - Communicates with backend AI chat endpoint
 */

/**
 * Send a chat message to the AI assistant
 * @param message - User's message
 * @param history - Previous chat history
 * @param sessionId - Optional session ID for maintaining context
 * @returns {Promise<{answer: string, sessionId: string, history: ChatMessage[]}>}
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = [],
  sessionId?: string
): Promise<{ answer: string; sessionId: string; history: ChatMessage[] }> {
  const response = await apiRequest('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      sessionId,
      conversationHistory: history.map(msg => ({
        role: msg.role,
        text: msg.text
      }))
    }),
  });

  const data = await response.json();

  // Build updated history with the new exchange
  const updatedHistory: ChatMessage[] = [
    ...history,
    { id: Date.now().toString(), role: 'user', text: message },
    { id: (Date.now() + 1).toString(), role: 'model', text: data.answer }
  ];

  return {
    answer: data.answer,
    sessionId: data.sessionId,
    history: updatedHistory
  };
}
