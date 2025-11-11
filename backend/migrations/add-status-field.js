/**
 * Migration Script: Add status field to existing documents
 *
 * This script updates all documents in Firestore that don't have a status field.
 * Documents with aiAnalysis are marked as 'complete', others as 'review'.
 *
 * Usage:
 *   node migrations/add-status-field.js
 */

import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

// Load environment variables (only in non-production environments)
// In production, environment variables are set by the environment
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const firestore = new Firestore();

async function migrateDocuments() {
  console.log('🔄 Starting migration: Adding status field to documents...\n');

  try {
    // Get all documents
    const snapshot = await firestore.collection('documents').get();
    console.log(`📊 Found ${snapshot.size} total documents\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each document
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docId = doc.id;

      // Skip if status already exists
      if (data.status) {
        console.log(`⏭️  Skipping ${docId} - already has status: ${data.status}`);
        skippedCount++;
        continue;
      }

      // Determine status based on presence of aiAnalysis
      const status = data.aiAnalysis ? 'complete' : 'review';

      try {
        await doc.ref.update({ status });
        console.log(`✅ Updated ${docId} - set status to: ${status}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${docId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Updated:  ${updatedCount} documents`);
    console.log(`⏭️  Skipped:  ${skippedCount} documents (already had status)`);
    console.log(`❌ Errors:   ${errorCount} documents`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the logs above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateDocuments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
