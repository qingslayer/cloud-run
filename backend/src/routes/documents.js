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

    // Build the base query
    let query = firestore.collection('documents').where('userId', '==', uid);

    // Add optional category filter
    if (category) {
      query = query.where('category', '==', category);
    }

    // Get total count for pagination
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    // Add sorting and pagination to the query
    query = query.orderBy('uploadDate', 'desc').limit(parseInt(limit)).offset(parseInt(offset));

    // Execute the query
    const snapshot = await query.get();

    // Extract documents from the snapshot
    const documents = [];
    snapshot.forEach(doc => {
      documents.push(doc.data());
    });

    res.json({
      documents,
      total,
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

    // 1. Fetch document from Firestore
    const docRef = firestore.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // 2. Verify user has access
    if (documentData.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this document' });
    }

    // 3. Generate signed URL for download
    const bucketName = process.env.STORAGE_BUCKET;
    const fileName = documentData.storagePath;

    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    const [downloadUrl] = await storage
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl(options);

    // 4. Return document metadata and URL
    res.json({
      ...documentData,
      downloadUrl,
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
  const { uid } = req.user;
  const { id } = req.params;

  console.log(`User ${uid} attempting to delete document ${id}`);

  try {
    // 1. Fetch document from Firestore
    const docRef = firestore.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`Document ${id} not found for deletion attempt by user ${uid}.`);
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // 2. Verify user has access
    if (documentData.userId !== uid) {
      console.warn(`User ${uid} forbidden to delete document ${id}. Document owned by ${documentData.userId}.`);
      return res.status(403).json({ error: 'Forbidden: You do not have access to this document' });
    }

    // 3. Delete file from Cloud Storage
    const bucketName = process.env.STORAGE_BUCKET;
    const fileName = documentData.storagePath;
    const file = storage.bucket(bucketName).file(fileName);

    const [exists] = await file.exists();
    if (exists) {
      try {
        await file.delete();
        console.log(`Successfully deleted gs://${bucketName}/${fileName} for document ${id}.`);
      } catch (storageError) {
        console.error(`Error deleting file from Cloud Storage for document ${id}:`, storageError);
        // If storage deletion fails, we don't want to delete the Firestore record
        return res.status(500).json({ error: 'Failed to delete file from storage.' });
      }
    } else {
      console.warn(`File gs://${bucketName}/${fileName} for document ${id} not found in Cloud Storage. Orphaned Firestore record?`);
    }

    // 4. Delete metadata from Firestore
    try {
      await docRef.delete();
      console.log(`Successfully deleted document ${id} from Firestore.`);
    } catch (firestoreError) {
      console.error(`CRITICAL: Failed to delete document ${id} from Firestore after deleting from Cloud Storage. ORPHANED FILE.`, firestoreError);
      // This is a critical error to log, as we now have an orphaned file in Cloud Storage.
      // The client doesn't need to know the details, but we should return an error.
      return res.status(500).json({ error: 'Failed to delete document metadata.' });
    }

    // 5. Return success response
    console.log(`User ${uid} successfully deleted document ${id}.`);
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      id
    });

  } catch (error) {
    console.error(`Unhandled error during deletion of document ${id}:`, error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

export default router;
