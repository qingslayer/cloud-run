import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { firestore } from '../config/firestore.js';
import { getAIChatResponse } from '../services/gemini/chatService.js';
import sessionCache from '../services/sessionCache.js';
import { sendBadRequest, sendForbidden, sendNotFound, sendServerError } from '../utils/responses.js';
import { ERROR_MESSAGES } from '../config/constants.js';

const router = express.Router();

/**
 * POST /api/chat
 * Handles conversational interactions, using a session cache for performance.
 */
router.post('/', async (req, res) => {
  try {
    const { uid } = req.user;
    let { message, sessionId, conversationHistory = [] } = req.body;

    if (!message) {
      return sendBadRequest(res, 'Message is required');
    }

    let documents;
    let cachedSession = null;

    if (sessionId) {
      cachedSession = sessionCache.get(sessionId);
      if (cachedSession) {
        // Security check: Ensure the session belongs to the authenticated user
        if (cachedSession.userId !== uid) {
          return sendForbidden(res, ERROR_MESSAGES.SESSION_ACCESS_DENIED);
        }
        documents = cachedSession.documents;
        conversationHistory = cachedSession.conversationHistory;
      }
    }

    // If no valid session was found, fetch from Firestore
    if (!documents) {
      const documentsSnapshot = await firestore.collection('documents').where('userId', '==', uid).get();
      documents = documentsSnapshot.docs.map(doc => doc.data());
    }

    // If no sessionId was provided, create a new one
    if (!sessionId) {
      sessionId = uuidv4();
    }

    const chatResult = await getAIChatResponse(message, documents, conversationHistory);

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', text: message },
      { role: 'model', text: chatResult.answer },
    ];

    // Update the cache with the new history and reset TTL
    sessionCache.set(sessionId, {
      userId: uid,
      documents,
      conversationHistory: updatedHistory,
    });

    res.json({
      ...chatResult,
      sessionId: sessionId,
    });
  } catch (error) {
    return sendServerError(res, error, ERROR_MESSAGES.CHAT_SEND_FAILED);
  }
});

/**
 * POST /api/chat/end-session
 * Explicitly ends a chat session by removing it from the cache.
 */
router.post('/end-session', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return sendBadRequest(res, 'Session ID is required');
  }

  const deleted = sessionCache.delete(sessionId);
  if (deleted) {
    return res.status(200).json({ success: true, message: 'Session ended successfully.' });
  } else {
    return sendNotFound(res, ERROR_MESSAGES.SESSION_NOT_FOUND);
  }
});

export default router;
