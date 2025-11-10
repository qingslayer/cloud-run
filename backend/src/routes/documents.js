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
import { getCachedResults, setCachedResults, invalidateUserCache } from '../services/searchCache.js';
import { rankDocuments } from '../services/searchRanking.js';
import Fuse from 'fuse.js';


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
 * Helper function to compute searchable text from document fields
 * This pre-computes the searchable text to avoid expensive JSON.stringify on every search
 * @param {object} doc - Document object with all fields
 * @returns {string} Concatenated searchable text in lowercase
 */
function computeSearchableText(doc) {
  const aiAnalysis = doc.aiAnalysis || {};

  const searchableText = [
    doc.filename?.toLowerCase() || '',
    doc.displayName?.toLowerCase() || '',
    doc.category?.toLowerCase() || '',
    doc.notes?.toLowerCase() || '',
    aiAnalysis.searchSummary?.toLowerCase() || '',
    JSON.stringify(aiAnalysis.structuredData || {}).toLowerCase(),
  ].join(' ');

  return searchableText;
}

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

          // Use pre-computed searchableText if available (much faster!)
          const searchableText = a.searchableText || [
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
        // Check cache first
        const cacheKey = { category, timeRange };
        const cachedResult = getCachedResults(query, uid, cacheKey);
        if (cachedResult) {
          return res.json(cachedResult);
        }

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

        // Apply keyword filter if keywords exist (with medical terminology synonym expansion + stemming)
        if (keywords && keywords.length > 0) {
          const beforeKeywordFilter = documents.length;
          documents = documents.filter(doc => {
            const a = doc.aiAnalysis || {};

            // Use pre-computed searchableText if available (much faster!)
            const searchableText = a.searchableText || [
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

        // Apply fuzzy search if we have keywords and got few or no results
        // This catches typos and variations that exact matching missed
        if (keywords && keywords.length > 0 && documents.length < 5) {
          console.log(`  Few results (${documents.length}), applying fuzzy search...`);

          // Get all documents (before keyword filter) for fuzzy matching
          let allDocs = snapshot.docs.map(doc => doc.data());
          allDocs = applyTimeFilter(allDocs);

          // Extract main search terms (first term from each keyword group)
          const searchTerms = keywords.map(group => group[0]).join(' ');

          // Configure Fuse.js for fuzzy matching
          const fuse = new Fuse(allDocs, {
            keys: [
              { name: 'filename', weight: 0.3 },
              { name: 'displayName', weight: 0.4 },
              { name: 'category', weight: 0.2 },
              { name: 'notes', weight: 0.1 },
              { name: 'aiAnalysis.searchSummary', weight: 0.2 },
            ],
            threshold: 0.3,  // 0.0 = perfect match, 1.0 = match anything
            includeScore: true,
            ignoreLocation: true,
            minMatchCharLength: 2,
          });

          const fuzzyResults = fuse.search(searchTerms);

          // Add fuzzy results that aren't already in exact matches
          const existingIds = new Set(documents.map(d => d.id));
          fuzzyResults.forEach(result => {
            if (!existingIds.has(result.item.id) && documents.length < 20) {
              documents.push(result.item);
              existingIds.add(result.item.id);
            }
          });

          console.log(`  After fuzzy search: ${documents.length} documents`);
        }

        // Apply relevance ranking (sorts by relevance score, then date)
        documents = rankDocuments(documents, keywords);
        console.log(`  Documents ranked by relevance`);

        console.log(`Document search for "${query}" returned ${documents.length} documents. No AI was used.`);

        // Prepare result
        const result = {
          type: 'documents',
          query,
          results: documents,
          count: documents.length,
        };

        // Cache the result for future requests
        setCachedResults(query, uid, result, cacheKey);

        return res.json(result);
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

        try {
          const summaryResult = await getAISummary(query, documents);
          return res.json({ type: 'summary', query, ...summaryResult });
        } catch (aiError) {
          console.warn('AI summary failed, falling back to document list:', aiError.message);
          // Fallback: return documents instead of AI summary
          const rankedDocs = rankDocuments(documents, keywords);
          return res.json({
            type: 'documents',
            query,
            results: rankedDocs,
            count: rankedDocs.length,
            fallback: true,
            fallbackReason: 'AI service temporarily unavailable'
          });
        }
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

        try {
          const answerResult = await getAIAnswer(query, documents);
          return res.json({ type: 'answer', query, ...answerResult });
        } catch (aiError) {
          console.warn('AI answer failed, falling back to document list:', aiError.message);
          // Fallback: return documents instead of AI answer
          const rankedDocs = rankDocuments(documents, keywords);
          return res.json({
            type: 'documents',
            query,
            results: rankedDocs,
            count: rankedDocs.length,
            fallback: true,
            fallbackReason: 'AI service temporarily unavailable'
          });
        }
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

    // Prepare analysis results
    const analysisResults = {
      displayName: categorization.title,
      category: categorization.category,
      aiAnalysis: {
        category: categorization.category,
        structuredData: structuredData,
        searchSummary: searchSummary,  // Concise summary for efficient AI search
      },
      analyzedAt: FieldValue.serverTimestamp(),
    };

    // Compute searchable text for fast searching (pre-compute to avoid JSON.stringify on every search)
    // We need to get the full document first to include filename and notes
    const docSnapshot = await docRef.get();
    const currentDoc = docSnapshot.data();
    const docWithUpdates = {
      ...currentDoc,
      ...analysisResults,
    };
    const searchableText = computeSearchableText(docWithUpdates);

    // Add searchableText to aiAnalysis
    analysisResults.aiAnalysis.searchableText = searchableText;

    await docRef.update(analysisResults);
    console.log(`Background AI analysis completed successfully for document ${documentId}`);

    // Invalidate search cache for this user (new document added)
    invalidateUserCache(currentDoc.userId);

  } catch (error) {
    console.error(`Background AI analysis failed for document ${documentId}:`, error);
    // Don't throw - we don't want to crash the process
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
        status: 'complete', // Documents are now considered complete by default
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

    // 5. Invalidate search cache for this user (since document was deleted)
    invalidateUserCache(uid);

    // 6. Return success response
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

    // Handle simple, top-level fields
    for (const field of editableFields) {
      if (updates.hasOwnProperty(field)) {
        // Allow notes to be an empty string, but trim others
        if (typeof updates[field] === 'string' && field !== 'notes') {
          updateData[field] = updates[field].trim();
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    // Handle nested structuredData field using dot notation
    if (updates['aiAnalysis.structuredData']) {
        updateData['aiAnalysis.structuredData'] = updates['aiAnalysis.structuredData'];
    }

    // Validate status field if present
    if (updateData.status && !['complete'].includes(updateData.status)) {
      return res.status(400).json({ error: 'Status must be "complete"' });
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

    // 5. Recompute searchableText if any searchable field was updated
    const searchableFieldsUpdated = ['displayName', 'category', 'notes', 'aiAnalysis.structuredData'].some(
      field => updateData.hasOwnProperty(field)
    );

    if (searchableFieldsUpdated) {
      // Get the document with updates applied to compute new searchable text
      const docWithUpdates = { ...documentData };

      // Apply updates to the copy
      Object.keys(updateData).forEach(key => {
        if (key.includes('.')) {
          // Handle nested fields like 'aiAnalysis.structuredData'
          const [parent, child] = key.split('.');
          if (!docWithUpdates[parent]) docWithUpdates[parent] = {};
          docWithUpdates[parent][child] = updateData[key];
        } else {
          docWithUpdates[key] = updateData[key];
        }
      });

      // Compute new searchable text
      const searchableText = computeSearchableText(docWithUpdates);
      updateData['aiAnalysis.searchableText'] = searchableText;

      console.log(`Recomputed searchableText for document ${id}`);
    }

    // 6. Update Firestore
    await docRef.update(updateData);

    // 7. Invalidate search cache for this user (since document changed)
    invalidateUserCache(uid);

    // 8. Return updated document
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
