import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Firestore } from '@google-cloud/firestore';
import { getAIChatResponse } from '../services/gemini/chatService.js';

const router = express.Router();
const firestore = new Firestore();

/**
 * POST /api/chat
 * Handles conversational interactions.
 */
router.post('/', async (req, res) => {
  try {
    const { uid } = req.user;
    const { message, sessionId, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch user's documents from Firestore
    const documentsSnapshot = await firestore.collection('documents').where('userId', '==', uid).get();
    const documents = documentsSnapshot.docs.map(doc => doc.data());

    const chatResult = await getAIChatResponse(message, documents, conversationHistory);

    const newSessionId = sessionId || uuidv4();

    res.json({
      ...chatResult,
      sessionId: newSessionId,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message,
    });
  }
});

export default router;
