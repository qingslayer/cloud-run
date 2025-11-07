import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import { processSearchQuery, shouldUseAISearch } from '../services/gemini/searchService.js';

const router = express.Router();
const firestore = new Firestore();

/**
 * POST /api/search
 * Search documents using natural language with Gemini AI or keyword matching.
 * Body: { query }
 */
router.post('/', async (req, res) => {
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
      documents.push({ id: doc.id, ...doc.data() });
    });

    // Determine if we should use AI search
    const useAI = shouldUseAISearch(query);

    if (!useAI) {
      // Simple keyword-based filtering
      const lowerQuery = query.toLowerCase();
      const filteredDocs = documents.filter(doc => {
        const aiAnalysis = doc.aiAnalysis || {};
        const searchableText = [
          doc.displayName,
          doc.category,
          aiAnalysis.summary,
          aiAnalysis.provider,
          ...(aiAnalysis.keyFindings || []).map(f => `${f.finding}: ${f.result}`)
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

export default router;