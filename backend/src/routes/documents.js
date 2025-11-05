import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';

const router = express.Router();
const storage = new Storage();
const firestore = new Firestore();

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
    const bucketName = process.env.STORAGE_BUCKET;
    const fileName = `${uid}/${documentId}/${file.originalname}`;
    const blob = storage.bucket(bucketName).file(fileName);

    // Upload file to Google Cloud Storage
    try {
      await new Promise((resolve, reject) => {
        const blobStream = blob.createWriteStream({
          resumable: false,
          metadata: {
            contentType: file.mimetype,
          },
        });

        blobStream.on('error', err => {
          console.error('Cloud Storage upload error:', err);
          reject(new Error('Unable to upload file to Cloud Storage.'));
        });

        blobStream.on('finish', () => {
          resolve();
        });

        blobStream.end(file.buffer);
      });
    } catch (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    // Save metadata to Firestore
    try {
      const docRef = firestore.collection('documents').doc(documentId);
      const documentMetadata = {
        id: documentId,
        userId: uid,
        filename: file.originalname,
        name: name || file.originalname, // Use provided name or original filename
        fileType: file.mimetype,
        size: file.size,
        category: category || 'uncategorized',
        storagePath: fileName,
        uploadDate: new Date().toISOString(),
      };
      await docRef.set(documentMetadata);

      res.status(201).json(documentMetadata);
    } catch (firestoreError) {
      // If Firestore save fails, attempt to delete the uploaded file from Cloud Storage
      console.error('Firestore save error:', firestoreError);
      try {
        await blob.delete();
        console.log('Successfully deleted file from Cloud Storage after Firestore error.');
      } catch (deleteError) {
        console.error('Error deleting file from Cloud Storage after Firestore error:', deleteError);
      }
      return res.status(500).json({ error: 'Failed to save document metadata.' });
    }

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
