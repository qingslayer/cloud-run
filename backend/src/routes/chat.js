import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Firestore } from '@google-cloud/firestore';
import { getAIChatResponse } from '../services/gemini/chatService.js';
import sessionCache from '../services/sessionCache.js';

const router = express.Router();
const firestore = new Firestore();

/**
 * POST /api/chat
 * Handles conversational interactions, using a session cache for performance.
 */
router.post('/', async (req, res) => {
  try {
    const { uid } = req.user;
    let { message, sessionId, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let documents;
    let cachedSession = null;

    if (sessionId) {
      cachedSession = sessionCache.get(sessionId);
      if (cachedSession) {
        // Security check: Ensure the session belongs to the authenticated user
        if (cachedSession.userId !== uid) {
          console.warn(`[Security] User ${uid} attempted to access session ${sessionId} owned by ${cachedSession.userId}.`);
          return res.status(403).json({ error: 'Forbidden: You do not have access to this session.' });
        }
        documents = cachedSession.documents;
        conversationHistory = cachedSession.conversationHistory;
        console.log(`[Cache HIT] Reusing documents for session ${sessionId}. Avoiding Firestore query.`);
      } else {
        console.log(`[Cache MISS] Session ${sessionId} not found or expired. Fetching fresh data.`);
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
      console.log(`New conversation started. Assigning sessionId: ${sessionId}`);
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
    console.error('Error in chat:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message,
    });
  }
});

/**
 * POST /api/chat/end-session
 * Explicitly ends a chat session by removing it from the cache.
 */
router.post('/end-session', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const deleted = sessionCache.delete(sessionId);
  if (deleted) {
    console.log(`Session ${sessionId} terminated by user.`);
    res.status(200).json({ success: true, message: 'Session ended successfully.' });
  } else {
    res.status(404).json({ success: false, message: 'Session not found.' });
  }
});

export default router;
