import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Firestore } from '@google-cloud/firestore';
import { sendChatMessage } from '../services/gemini/chatService.js';
import { processSearchQuery, shouldUseAISearch } from '../services/gemini/searchService.js';
import { 
  extractTextFromDocument, 
  analyzeAndCategorizeDocument, 
  extractStructuredData 
} from '../services/gemini/documentProcessor.js';

const router = express.Router();
const firestore = new Firestore();

/**
 * POST /api/ai/search
 * Search documents using natural language with Gemini AI
 * Body: { query }
 */
router.post('/search', async (req, res) => {
  try {
    const { uid } = req.user;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Fetch user's documents from Firestore
    const documentsSnapshot = await firestore
      .collection('documents')
      .where('userId', '==', uid)
      .where('status', '==', 'complete')
      .get();

    const documents = [];
    documentsSnapshot.forEach(doc => {
      documents.push(doc.data());
    });

    // Determine if we should use AI search
    const useAI = shouldUseAISearch(query);

    if (!useAI) {
      // Simple keyword-based filtering
      const lowerQuery = query.toLowerCase();
      const filteredDocs = documents.filter(doc => {
        const searchableText = [
          doc.title,
          doc.category,
          doc.userNotes || '',
          JSON.stringify(doc.structuredData || {})
        ].join(' ').toLowerCase();
        
        return searchableText.includes(lowerQuery);
      });

      return res.json({
        type: 'documents',
        documents: filteredDocs,
        query
      });
    }

    // Use AI-powered search
    const searchResult = await processSearchQuery(query, documents);

    res.json({
      type: 'answer',
      answer: searchResult.answer,
      sources: searchResult.sources,
      query
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      error: 'Failed to search documents',
      message: error.message
    });
  }
});

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

/**
 * POST /api/ai/process-document
 * Process a document: extract text, categorize, and extract structured data
 * Body: { base64Data, mimeType }
 */
router.post('/process-document', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ 
        error: 'base64Data and mimeType are required' 
      });
    }

    // Step 1: Extract text from document
    const extractedText = await extractTextFromDocument(base64Data, mimeType);

    // Step 2: Analyze and categorize
    const { title, category } = await analyzeAndCategorizeDocument(extractedText);

    // Step 3: Extract structured data
    const structuredData = await extractStructuredData(extractedText, category);

    res.json({
      extractedText,
      title,
      category,
      structuredData,
      status: 'review' // Frontend should review before saving
    });
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({
      error: 'Failed to process document',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/extract-text
 * Extract text from a document (OCR for images, parsing for PDFs)
 * Body: { base64Data, mimeType }
 */
router.post('/extract-text', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ 
        error: 'base64Data and mimeType are required' 
      });
    }

    const extractedText = await extractTextFromDocument(base64Data, mimeType);

    res.json({
      text: extractedText
    });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({
      error: 'Failed to extract text',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/categorize
 * Analyze and categorize document text
 * Body: { text }
 */
router.post('/categorize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await analyzeAndCategorizeDocument(text);

    res.json(result);
  } catch (error) {
    console.error('Error categorizing document:', error);
    res.status(500).json({
      error: 'Failed to categorize document',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/extract-structured-data
 * Extract structured data from document text
 * Body: { text, category }
 */
router.post('/extract-structured-data', async (req, res) => {
  try {
    const { text, category } = req.body;

    if (!text || !category) {
      return res.status(400).json({ 
        error: 'text and category are required' 
      });
    }

    const structuredData = await extractStructuredData(text, category);

    res.json(structuredData);
  } catch (error) {
    console.error('Error extracting structured data:', error);
    res.status(500).json({
      error: 'Failed to extract structured data',
      message: error.message
    });
  }
});

export default router;
