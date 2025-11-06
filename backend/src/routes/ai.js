import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import { sendChatMessage } from '../services/gemini/chatService.js';

const router = express.Router();
const firestore = new Firestore();

/**
 * POST /api/ai/chat
 * Chat with AI assistant about health documents
 * Body: { message, history }
 */
router.post('/chat', async (req, res) => {
  try {
    const { uid } = req.user;
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch user's documents for context
    const documentsSnapshot = await firestore
      .collection('documents')
      .where('userId', '==', uid)
      .where('status', '==', 'complete')
      .get();

    const documents = [];
    documentsSnapshot.forEach(doc => {
      documents.push(doc.data());
    });

    // Send message and get response
    const result = await sendChatMessage(message, documents, history);

    res.json({
      text: result.text,
      history: result.history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message
    });
  }
});



export default router;
