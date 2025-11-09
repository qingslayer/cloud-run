/**
 * Migration Script: Delete all documents
 *
 * This script deletes all documents from both Firestore and Cloud Storage.
 * Use this to start fresh with the new schema that includes searchSummary.
 *
 * Usage:
 *   node migrations/delete-all-documents.js
 */

import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firestore = new Firestore();
const storage = new Storage();
const bucketName = process.env.STORAGE_BUCKET;

async function deleteAllDocuments() {
  console.log('🗑️  Starting migration: Delete all documents');
  console.log('='.repeat(60) + '\n');

  if (!bucketName) {
    console.error('❌ STORAGE_BUCKET environment variable not set!');
    console.error('Please set STORAGE_BUCKET in your .env file.');
    process.exit(1);
  }

  console.log(`📦 Storage bucket: ${bucketName}\n`);

  try {
    // Fetch all documents
    const snapshot = await firestore.collection('documents').get();
    const totalDocs = snapshot.size;

    console.log(`📊 Found ${totalDocs} documents to delete\n`);

    if (totalDocs === 0) {
      console.log('✅ No documents to delete. Collection is already empty.');
      return;
    }

    // Warning and countdown
    console.log('⚠️  WARNING: This will permanently delete all documents!');
    console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🚀 Starting deletion...\n');

    let successCount = 0;
    let errorCount = 0;

    // Delete each document
    for (const doc of snapshot.docs) {
      const docId = doc.id;
      const data = doc.data();
      const displayName = data.displayName || data.filename || docId;

      try {
        // Delete from Cloud Storage
        if (data.storagePath) {
          const file = storage.bucket(bucketName).file(data.storagePath);
          const [exists] = await file.exists();

          if (exists) {
            await file.delete();
            console.log(`✅ ${displayName} - deleted from storage`);
          }
        }

        // Delete from Firestore
        await doc.ref.delete();
        console.log(`✅ ${displayName} - deleted from Firestore`);

        successCount++;
      } catch (error) {
        console.error(`❌ ${displayName} - error:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Deleted:  ${successCount} documents`);
    console.log(`❌ Errors:   ${errorCount} documents`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n🎉 All documents deleted successfully!');
      console.log('You can now upload fresh documents with the new schema.\n');
    } else {
      console.log('\n⚠️  Completed with errors. Please review the logs above.\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
deleteAllDocuments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
