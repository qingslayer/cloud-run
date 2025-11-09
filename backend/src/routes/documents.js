import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { getAIChatResponse } from '../services/gemini/chatService.js';
import { getAISummary, getAIAnswer } from '../services/gemini/searchService.js';
import { extractTextFromDocument, analyzeAndCategorizeDocument, extractStructuredData, generateSearchSummary } from '../services/gemini/documentProcessor.js';
import { Firestore, FieldValue } from '@google-cloud/firestore';
import { analyzeQuery } from '../services/queryAnalyzer.js';
import sessionCache from '../services/sessionCache.js';


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
 * POST /api/documents/search
 * The unified search endpoint for all user queries.
 */
router.post('/search', async (req, res) => {
  try {
    const { uid } = req.user;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const { type, category, keywords, timeRange } = analyzeQuery(query);

    console.log(`Query: "${query}" → Type: ${type}, Category: ${category}, Keywords: ${JSON.stringify(keywords)}, Time: ${timeRange ? timeRange.type : 'none'}`);

    // Helper function to apply time filter only (for direct document queries)
    const applyTimeFilter = (docs) => {
      if (!timeRange) return docs;

      return docs.filter(doc => {
        const docDate = new Date(doc.uploadDate);

        if (timeRange.type === 'after') {
          return docDate > new Date(timeRange.value);
        } else if (timeRange.type === 'year') {
          return docDate.getFullYear() === timeRange.value;
        } else if (timeRange.type === 'yearFrom') {
          return docDate.getFullYear() >= timeRange.value;
        }
        return true;
      });
    };

    // Helper function to filter documents by time range AND keywords (for AI queries)
    const filterDocumentsForAI = (docs) => {
      console.log(`  Starting with ${docs.length} documents`);

      // First apply time filter
      let filtered = applyTimeFilter(docs);
      console.log(`  After time filter: ${filtered.length} documents`);

      // For AI queries, skip keyword filtering if category is already identified
      // The AI is smart enough to determine relevance from category-filtered documents
      // Keyword filtering can be too strict (e.g., "appointment" vs "visit summary")
      if (category) {
        console.log(`  Category already identified ('${category}'), skipping keyword filter for AI processing`);
        return filtered;
      }

      // Only apply keyword filter if no category and keywords exist
      // This helps narrow down documents when category wasn't identified
      if (keywords && keywords.length > 0) {
        const beforeKeywordFilter = filtered.length;
        filtered = filtered.filter(doc => {
          const a = doc.aiAnalysis || {};

          // Build searchable text from metadata, summary, and structured data
          const searchableText = [
            doc.filename?.toLowerCase() || '',
            doc.displayName?.toLowerCase() || '',
            doc.category?.toLowerCase() || '',
            doc.notes?.toLowerCase() || '',
            a.searchSummary?.toLowerCase() || '',
            JSON.stringify(a.structuredData || {}).toLowerCase(),
          ].join(' ');

          // Each keyword group must have at least one match
          const allGroupsMatch = keywords.every(group =>
            group.some(term => searchableText.includes(term.toLowerCase()))
          );

          return allGroupsMatch;
        });
        console.log(`  After keyword filter: ${filtered.length} documents (filtered out ${beforeKeywordFilter - filtered.length})`);
      }

      return filtered;
    };

    switch (type) {
      case 'documents': {
        let firestoreQuery = firestore.collection('documents')
          .where('userId', '==', uid)
          .orderBy('uploadDate', 'desc')  // Order by most recent first
          .limit(50);  // Limit to 50 most recent for fast display

        if (category) {
          firestoreQuery = firestoreQuery.where('category', '==', category);
        }
        const snapshot = await firestoreQuery.get();
        let documents = snapshot.docs.map(doc => doc.data());

        console.log(`  Starting with ${documents.length} documents from Firestore`);

        // Apply time filter
        documents = applyTimeFilter(documents);
        console.log(`  After time filter: ${documents.length} documents`);

        // Apply keyword filter if keywords exist (with medical terminology synonym expansion)
        if (keywords && keywords.length > 0) {
          const beforeKeywordFilter = documents.length;
          documents = documents.filter(doc => {
            const a = doc.aiAnalysis || {};

            // Build searchable text from metadata, summary, and structured data
            const searchableText = [
              doc.filename?.toLowerCase() || '',
              doc.displayName?.toLowerCase() || '',
              doc.category?.toLowerCase() || '',
              doc.notes?.toLowerCase() || '',
              a.searchSummary?.toLowerCase() || '',
              JSON.stringify(a.structuredData || {}).toLowerCase(),
            ].join(' ');

            // Each keyword group must have at least one match (OR logic within groups)
            const allGroupsMatch = keywords.every(group =>
              group.some(term => searchableText.includes(term.toLowerCase()))
            );

            return allGroupsMatch;
          });
          console.log(`  After keyword filter: ${documents.length} documents (filtered out ${beforeKeywordFilter - documents.length})`);
        }

        console.log(`Document search for "${query}" returned ${documents.length} documents. No AI was used.`);

        return res.json({
          type: 'documents',
          query,
          results: documents,
          count: documents.length,
        });
      }
      

// ... (existing code)

      case 'summary': {
        let firestoreQuery = firestore.collection('documents')
          .where('userId', '==', uid)
          .orderBy('uploadDate', 'desc')  // Order by most recent first
          .limit(15);  // Limit to 15 most recent for AI summary

        if (category) {
          firestoreQuery = firestoreQuery.where('category', '==', category);
        }
        const documentsSnapshot = await firestoreQuery.get();
        let documents = documentsSnapshot.docs.map(doc => doc.data());

        // For AI queries, apply time filter (and keyword filter only if no category identified)
        documents = filterDocumentsForAI(documents);

        const summaryResult = await getAISummary(query, documents);
        return res.json({ type: 'summary', query, ...summaryResult });
      }
      case 'answer': {
        let firestoreQuery = firestore.collection('documents')
          .where('userId', '==', uid)
          .orderBy('uploadDate', 'desc')  // Order by most recent first
          .limit(10);  // Limit to 10 most recent for AI answers

        if (category) {
          firestoreQuery = firestoreQuery.where('category', '==', category);
        }
        const documentsSnapshot = await firestoreQuery.get();
        let documents = documentsSnapshot.docs.map(doc => doc.data());

        // For AI queries, apply time filter (and keyword filter only if no category identified)
        documents = filterDocumentsForAI(documents);

        const answerResult = await getAIAnswer(query, documents);
        return res.json({ type: 'answer', query, ...answerResult });
      }

      default:
        return res.status(400).json({ error: 'Invalid query type' });
    }
  } catch (error) {
    console.error('Error in unified search:', error);
    res.status(500).json({ error: 'Failed to execute search' });
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
 * Analyze a document asynchronously (background processing)
 * @param {string} documentId - Document ID
 * @param {Buffer} fileBuffer - File data buffer
 * @param {string} mimeType - File MIME type
 */
async function analyzeDocumentAsync(documentId, fileBuffer, mimeType) {
  console.log(`Starting background AI analysis for document ${documentId}`);

  try {
    const docRef = firestore.collection('documents').doc(documentId);
    const base64Data = fileBuffer.toString('base64');

    // Extract text
    console.log('Extracting text...');
    const extractedText = await extractTextFromDocument(base64Data, mimeType);
    console.log(`Text extracted (length: ${extractedText.length})`);

    // Analyze and categorize
    console.log('Analyzing and categorizing...');
    const categorization = await analyzeAndCategorizeDocument(extractedText);
    console.log('Categorization complete:', categorization);

    // Extract structured data
    console.log('Extracting structured data...');
    console.log(`  Category: "${categorization.category}"`);
    console.log(`  Text length: ${extractedText.length} characters`);
    const structuredData = await extractStructuredData(extractedText, categorization.category);
    console.log('Structured data extraction complete.');
    console.log('  Result keys:', Object.keys(structuredData || {}));

    // Generate search summary (for efficient AI querying)
    console.log('Generating search summary...');
    const searchSummary = await generateSearchSummary(extractedText, categorization.category, structuredData);
    console.log('Search summary generated.');
    console.log(`  Summary length: ${searchSummary.length} characters`);

    // Update document with analysis results
    const analysisResults = {
      displayName: categorization.title,
      category: categorization.category,
      aiAnalysis: {
        category: categorization.category,
        structuredData: structuredData,
        searchSummary: searchSummary,  // Concise summary for efficient AI search
      },
      status: 'complete',
      analyzedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(analysisResults);
    console.log(`Background AI analysis completed successfully for document ${documentId}`);

  } catch (error) {
    console.error(`Background AI analysis failed for document ${documentId}:`, error);
    // Don't throw - we don't want to crash the process
    // The document will remain in 'review' status and can be manually analyzed later
  }
}

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
        displayName: null, // To be populated by AI analysis later
        fileType: file.mimetype,
        size: file.size,
        category: category || 'uncategorized',
        storagePath: fileName,
        uploadDate: new Date().toISOString(),
        status: 'review', // New documents start in review status
      };
      await docRef.set(documentMetadata);

      // Trigger AI analysis in the background (don't wait for it)
      analyzeDocumentAsync(documentId, file.buffer, file.mimetype).catch(err => {
        console.error(`Background AI analysis failed for document ${documentId}:`, err);
      });

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

/**
 * PATCH /api/documents/:id
 * Edit a document's metadata
 */
router.patch('/:id', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  const updates = req.body;

  console.log(`User ${uid} attempting to edit document ${id} with updates:`, updates);

  try {
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

    // 3. Validate request body
    const immutableFields = ['id', 'userId', 'filename', 'fileType', 'size', 'storagePath', 'uploadDate'];
    for (const field of immutableFields) {
      if (updates.hasOwnProperty(field)) {
        return res.status(400).json({ error: `Cannot update immutable field: ${field}` });
      }
    }

    const updateData = {};
    const editableFields = ['displayName', 'category', 'notes', 'status'];

    for (const field of editableFields) {
      if (updates.hasOwnProperty(field)) {
        if (typeof updates[field] === 'string') {
          updateData[field] = updates[field].trim();
        } else {
          updateData[field] = updates[field]; // Allow null for displayName
        }
      }
    }

    // Validate status field if present
    if (updateData.status && !['review', 'complete'].includes(updateData.status)) {
      return res.status(400).json({ error: 'Status must be either "review" or "complete"' });
    }
    
    // Don't allow category to be an empty string
    if (updateData.category === '') {
        return res.status(400).json({ error: 'Category cannot be an empty string.' });
    }

    // If there's nothing to update, just return the document
    if (Object.keys(updateData).length === 0) {
      return res.json(documentData);
    }

    // 4. Add lastModified timestamp
    updateData.lastModified = FieldValue.serverTimestamp();

    // 5. Update Firestore
    await docRef.update(updateData);

    // 6. Return updated document
    const updatedDoc = await docRef.get();
    res.json(updatedDoc.data());

  } catch (error) {
    console.error(`Error editing document ${id}:`, error);
    res.status(500).json({
      error: 'Failed to edit document',
      message: error.message
    });
  }
});

/**
 * POST /api/documents/:id/analyze
 * Trigger AI analysis for a document
 */
router.post('/:id/analyze', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;

  console.log(`User ${uid} starting analysis for document ${id}`);

  try {
    // 1. Fetch document from Firestore and verify ownership
    const docRef = firestore.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    if (documentData.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this document' });
    }

    // 2. Download file from Cloud Storage
    console.log(`Downloading gs://${process.env.STORAGE_BUCKET}/${documentData.storagePath}`);
    const fileBuffer = await storage.bucket(process.env.STORAGE_BUCKET).file(documentData.storagePath).download();
    const base64Data = fileBuffer[0].toString('base64');
    console.log(`File downloaded and converted to base64 (size: ${base64Data.length})`);

    // 3. Analyze with Gemini (using existing services)
    let analysisResults;
    try {
      console.log('Extracting text...');
      const extractedText = await extractTextFromDocument(base64Data, documentData.fileType);
      console.log(`Text extracted (length: ${extractedText.length})`);

      console.log('Analyzing and categorizing...');
      const categorization = await analyzeAndCategorizeDocument(extractedText);
      console.log('Categorization complete:', categorization);

      console.log('Extracting structured data...');
      const structuredData = await extractStructuredData(extractedText, categorization.category);
      console.log('Structured data extraction complete.');

      console.log('Generating search summary...');
      const searchSummary = await generateSearchSummary(extractedText, categorization.category, structuredData);
      console.log('Search summary generated.');

      analysisResults = {
        displayName: categorization.title,
        category: categorization.category,
        aiAnalysis: {
          category: categorization.category,
          structuredData: structuredData,
          searchSummary: searchSummary,  // Concise summary for efficient AI search
        },
        status: 'complete', // Mark as complete after successful analysis
        analyzedAt: FieldValue.serverTimestamp(),
      };

    } catch (aiError) {
      console.error(`AI processing failed for document ${id}:`, aiError);
      const userMessage = 'Unable to analyze document. The AI model could not process the file.';
      return res.status(500).json({
        error: userMessage,
        details: process.env.NODE_ENV !== 'production' ? aiError.message : undefined,
      });
    }

    // 4. Save the results to Firestore
    console.log('Saving analysis results to Firestore...');
    await docRef.update(analysisResults);
    console.log('Firestore updated successfully.');

    // 5. Return the complete, updated document
    const updatedDoc = await docRef.get();
    res.json(updatedDoc.data());

  } catch (error) {
    console.error(`Unhandled error during analysis of document ${id}:`, error);
    res.status(500).json({
      error: 'A server error occurred during document analysis.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
});

export default router;
