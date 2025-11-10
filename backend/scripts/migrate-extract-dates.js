/**
 * Migration Script: Re-analyze all documents to extract dates properly
 *
 * Run with: node -r dotenv/config scripts/migrate-extract-dates.js
 */

import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { extractTextFromDocument, analyzeAndCategorizeDocument, extractStructuredData, generateSearchSummary } from '../src/services/gemini/documentProcessor.js';

const firestore = new Firestore();
const storage = new Storage();

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 2000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function reanalyzeDocument(doc) {
  const documentId = doc.id;

  try {
    const bucketName = process.env.STORAGE_BUCKET;
    const storagePath = doc.storagePath;

    const fileBuffer = await storage.bucket(bucketName).file(storagePath).download();
    const base64Data = fileBuffer[0].toString('base64');

    const extractedText = await extractTextFromDocument(base64Data, doc.fileType);
    const categorization = await analyzeAndCategorizeDocument(extractedText);
    const structuredData = await extractStructuredData(extractedText, categorization.category);
    const searchSummary = await generateSearchSummary(extractedText, categorization.category, structuredData);

    const updates = {
      displayName: categorization.title,
      category: categorization.category,
      'aiAnalysis.category': categorization.category,
      'aiAnalysis.structuredData': structuredData,
      'aiAnalysis.searchSummary': searchSummary,
    };

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

    const docRef = firestore.collection('documents').doc(documentId);
    await docRef.update(updates);

    console.log(`✅ Successfully re-analyzed ${documentId}`);
    return { success: true, id: documentId };

  } catch (error) {
    console.error(`❌ Failed to re-analyze ${documentId}:`, error.message);
    return { success: false, id: documentId, error: error.message };
  }
}

async function migrate() {
  console.log('='.repeat(60));
  console.log('📄 Document Date Extraction Migration');
  console.log('='.repeat(60));

  try {
    console.log('\n📥 Fetching all documents from Firestore...');
    const snapshot = await firestore.collection('documents').get();
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Found ${documents.length} documents\n`);

    if (documents.length === 0) {
      console.log('No documents to process. Exiting.');
      return;
    }

    const results = {
      total: documents.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(doc => reanalyzeDocument(doc))
      );

      batchResults.forEach(result => {
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: result.id, error: result.error });
        }
      });

      if (i + BATCH_SIZE < documents.length) {
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }
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


  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
