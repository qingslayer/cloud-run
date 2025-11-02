import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Enable CORS for all routes
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * Health check endpoint
 * Returns server status and configuration info
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// ============================================================================
// DOCUMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/documents
 * List all documents for the user
 * Query params: userId, category, limit, offset
 */
app.get('/api/documents', async (req, res) => {
  try {
    const { userId, category, limit = 50, offset = 0 } = req.query;

    // TODO: Implement Firestore query to fetch documents
    // - Filter by userId (required)
    // - Filter by category (optional)
    // - Apply pagination with limit and offset
    // - Sort by upload date (newest first)

    // Placeholder response
    res.json({
      documents: [],
      total: 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      message: error.message
    });
  }
});

/**
 * GET /api/documents/:id
 * Get a single document by ID
 * Returns document metadata and download URL
 */
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement Firestore query to fetch document by ID
    // - Verify user has access to this document
    // - Generate signed URL for document download from Cloud Storage
    // - Return document metadata and URL

    // Placeholder response
    res.json({
      id,
      name: 'Sample Document',
      category: 'lab_results',
      uploadDate: new Date().toISOString(),
      downloadUrl: null
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      error: 'Failed to fetch document',
      message: error.message
    });
  }
});

/**
 * POST /api/upload
 * Upload a new document
 * Expects multipart/form-data with file and metadata
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { userId, category, name } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Generate unique document ID
    const documentId = uuidv4();

    // TODO: Implement document upload workflow
    // 1. Upload file to Google Cloud Storage
    //    - Path: `documents/${userId}/${documentId}/${file.originalname}`
    //    - Store file buffer from req.file.buffer
    // 2. Process document with Gemini API
    //    - Extract text content (use pdf-parse for PDFs)
    //    - Analyze with Gemini to extract structured data
    //    - Categorize document if category not provided
    // 3. Save metadata to Firestore
    //    - Collection: 'documents'
    //    - Document ID: documentId
    //    - Fields: userId, name, category, uploadDate, fileSize, mimeType, etc.
    // 4. Return document metadata

    // Placeholder response
    res.status(201).json({
      id: documentId,
      name: file.originalname,
      category: category || 'uncategorized',
      uploadDate: new Date().toISOString(),
      size: file.size,
      mimeType: file.mimetype
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      error: 'Failed to upload document',
      message: error.message
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 * Removes from both Cloud Storage and Firestore
 */
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // TODO: Implement document deletion
    // 1. Verify user owns this document (check Firestore)
    // 2. Delete file from Cloud Storage
    // 3. Delete metadata from Firestore
    // 4. Return success response

    // Placeholder response
    res.json({
      success: true,
      message: 'Document deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

// ============================================================================
// AI ENDPOINTS
// ============================================================================

/**
 * POST /api/search
 * Search documents using natural language with Gemini AI
 * Body: { query, userId, filters }
 */
app.post('/api/search', async (req, res) => {
  try {
    const { query, userId, filters } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // TODO: Implement AI-powered search
    // 1. Fetch user's documents from Firestore
    // 2. Use Gemini API to understand search intent
    // 3. Match query against document content and metadata
    // 4. Rank and return relevant documents
    // 5. Include AI-generated summary of why each document matches

    // Placeholder response
    res.json({
      query,
      results: [],
      summary: 'No results found',
      totalResults: 0
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
 * POST /api/chat
 * Chat with AI assistant about health documents
 * Body: { message, userId, conversationId, context }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId, conversationId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // TODO: Implement AI chat functionality
    // 1. Retrieve conversation history (if conversationId provided)
    // 2. Fetch relevant documents based on context
    // 3. Build prompt with user's message and document context
    // 4. Call Gemini API to generate response
    // 5. Save conversation to Firestore
    // 6. Return AI response with citations

    // Placeholder response
    res.json({
      response: 'I\'m here to help you understand your health documents. What would you like to know?',
      conversationId: conversationId || uuidv4(),
      timestamp: new Date().toISOString(),
      citations: []
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
});

