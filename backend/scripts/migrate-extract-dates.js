/**
 * Migration Script: Re-analyze all documents to extract dates properly
 *
 * This script:
 * 1. Fetches all documents from Firestore
 * 2. Downloads each document from Cloud Storage
 * 3. Triggers AI re-analysis to extract dates into structuredData
 * 4. Updates the document with new AI results
 *
 * Run with: node -r dotenv/config scripts/migrate-extract-dates.js
 */

import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { extractTextFromDocument, analyzeAndCategorizeDocument, extractStructuredData, generateSearchSummary } from '../src/services/gemini/documentProcessor.js';

const firestore = new Firestore();
const storage = new Storage();

// Configuration
const BATCH_SIZE = 5; // Process 5 documents at a time to avoid rate limits
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Compute searchable text from document fields
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
 * Re-analyze a single document
 */
async function reanalyzeDocument(doc) {
  const documentId = doc.id;
  console.log(`\n[${documentId}] Starting re-analysis...`);
  console.log(`  - Display Name: ${doc.displayName || doc.filename}`);
  console.log(`  - Category: ${doc.category}`);

  try {
    // 1. Download file from Cloud Storage
    const bucketName = process.env.STORAGE_BUCKET;
    const storagePath = doc.storagePath;

    console.log(`  - Downloading from gs://${bucketName}/${storagePath}`);
    const fileBuffer = await storage.bucket(bucketName).file(storagePath).download();
    const base64Data = fileBuffer[0].toString('base64');

    // 2. Extract text
    console.log(`  - Extracting text...`);
    const extractedText = await extractTextFromDocument(base64Data, doc.fileType);
    console.log(`  - Text extracted (${extractedText.length} characters)`);

    // 3. Analyze and categorize
    console.log(`  - Analyzing and categorizing...`);
    const categorization = await analyzeAndCategorizeDocument(extractedText);
    console.log(`  - Category: ${categorization.category}, Title: ${categorization.title}`);

    // 4. Extract structured data (with date field!)
    console.log(`  - Extracting structured data...`);
    const structuredData = await extractStructuredData(extractedText, categorization.category);
    console.log(`  - Structured data extracted:`, JSON.stringify(structuredData, null, 2));

    // 5. Generate search summary
    console.log(`  - Generating search summary...`);
    const searchSummary = await generateSearchSummary(extractedText, categorization.category, structuredData);

    // 6. Prepare update
    const updates = {
      displayName: categorization.title,
      category: categorization.category,
      'aiAnalysis.category': categorization.category,
      'aiAnalysis.structuredData': structuredData,
      'aiAnalysis.searchSummary': searchSummary,
    };

    // Compute searchable text
    const docWithUpdates = {
      ...doc,
      displayName: categorization.title,
      category: categorization.category,
      aiAnalysis: {
        ...(doc.aiAnalysis || {}),
        category: categorization.category,
        structuredData: structuredData,
        searchSummary: searchSummary,
      }
    };
    const searchableText = computeSearchableText(docWithUpdates);
    updates['aiAnalysis.searchableText'] = searchableText;

    // 7. Update Firestore
    console.log(`  - Updating Firestore...`);
    const docRef = firestore.collection('documents').doc(documentId);
    await docRef.update(updates);

    console.log(`  ✅ Successfully re-analyzed ${documentId}`);
    return { success: true, id: documentId };

  } catch (error) {
    console.error(`  ❌ Failed to re-analyze ${documentId}:`, error.message);
    return { success: false, id: documentId, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('='.repeat(60));
  console.log('📄 Document Date Extraction Migration');
  console.log('='.repeat(60));
  console.log(`\nConfiguration:`);
  console.log(`  - Batch size: ${BATCH_SIZE}`);
  console.log(`  - Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log(`  - Storage bucket: ${process.env.STORAGE_BUCKET}`);
  console.log('');

  try {
    // 1. Fetch all documents
    console.log('📥 Fetching all documents from Firestore...');
    const snapshot = await firestore.collection('documents').get();
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Found ${documents.length} documents\n`);

    if (documents.length === 0) {
      console.log('No documents to process. Exiting.');
      return;
    }

    // 2. Process in batches
    const results = {
      total: documents.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(documents.length / BATCH_SIZE);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 Processing Batch ${batchNumber}/${totalBatches} (${batch.length} documents)`);
      console.log('='.repeat(60));

      // Process batch concurrently
      const batchResults = await Promise.all(
        batch.map(doc => reanalyzeDocument(doc))
      );

      // Count results
      batchResults.forEach(result => {
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: result.id, error: result.error });
        }
      });

      // Show progress
      console.log(`\n📊 Progress: ${results.successful + results.failed}/${results.total} documents processed`);
      console.log(`   ✅ Successful: ${results.successful}`);
      console.log(`   ❌ Failed: ${results.failed}`);

      // Delay before next batch (except for last batch)
      if (i + BATCH_SIZE < documents.length) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    // 3. Final report
    console.log('\n' + '='.repeat(60));
    console.log('✨ Migration Complete!');
    console.log('='.repeat(60));
    console.log(`\n📊 Final Results:`);
    console.log(`   Total documents: ${results.total}`);
    console.log(`   ✅ Successfully re-analyzed: ${results.successful}`);
    console.log(`   ❌ Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log(`\n❌ Failed Documents:`);
      results.errors.forEach(({ id, error }) => {
        console.log(`   - ${id}: ${error}`);
      });
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
