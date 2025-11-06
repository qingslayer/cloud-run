import { apiRequest } from '../config/api';
import { ChatMessage } from '../types';

/**
 * Chat Service - Communicates with backend AI chat endpoint
 */

/**
 * Send a chat message to the AI assistant
 * @param message - User's message
 * @param history - Previous chat history
 * @returns {Promise<{text: string, history: ChatMessage[]}>}
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<{ text: string; history: ChatMessage[] }> {
  const response = await apiRequest('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      history: history.map(msg => ({
        role: msg.role,
        text: msg.text
      }))
    }),
  });

  const data = await response.json();
  return {
    text: data.text,
    history: data.history
  };
}
