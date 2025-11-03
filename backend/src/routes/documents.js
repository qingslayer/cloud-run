import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * GET /api/documents
 * List all documents for the authenticated user
 * Query params: category, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { uid } = req.user; // UID from authenticated user
    const { category, limit = 50, offset = 0 } = req.query;

    // TODO: Implement Firestore query to fetch documents
    // - Filter by uid (required)
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
router.get('/:id', async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // TODO: Implement Firestore query to fetch document by ID
    // - Verify user (uid) has access to this document
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
 * POST /api/documents/upload
 * Upload a new document
 * Expects multipart/form-data with file and metadata
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { uid } = req.user;
    const file = req.file;
    const { category, name } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const documentId = uuidv4();

    // TODO: Implement document upload workflow
    // 1. Upload file to Google Cloud Storage
    //    - Path: `documents/${uid}/${documentId}/${file.originalname}`
    // 2. Process document with Gemini API (via backend service)
    // 3. Save metadata to Firestore
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
router.delete('/:id', async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // TODO: Implement document deletion
    // 1. Verify user (uid) owns this document (check Firestore)
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

export default router;
