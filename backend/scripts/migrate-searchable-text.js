/**
 * Migration Script: Add searchableText to Existing Documents
 *
 * This script computes and adds the searchableText field to all existing documents
 * in Firestore that don't already have it. This improves search performance by
 * pre-computing the text that would otherwise need to be generated on every search.
 *
 * Usage:
 *   node scripts/migrate-searchable-text.js [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();

/**
 * Compute searchable text from document fields
 * (Same logic as in routes/documents.js)
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
 * Migrate a single document
 */
async function migrateDocument(docId, docData, dryRun = false) {
  try {
    // Check if searchableText already exists
    if (docData.aiAnalysis?.searchableText) {
      console.log(`  ✓ Document ${docId} already has searchableText, skipping`);
      return { status: 'skipped', reason: 'already_exists' };
    }

    // Compute searchable text
    const searchableText = computeSearchableText(docData);

    if (dryRun) {
      console.log(`  [DRY RUN] Would add searchableText to document ${docId}`);
      console.log(`    Preview: ${searchableText.substring(0, 100)}...`);
      return { status: 'would_update' };
    }

    // Update document in Firestore
    await firestore.collection('documents').doc(docId).update({
      'aiAnalysis.searchableText': searchableText,
    });

    console.log(`  ✓ Updated document ${docId}`);
    return { status: 'updated' };

  } catch (error) {
    console.error(`  ✗ Error migrating document ${docId}:`, error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Main migration function
 */
async function runMigration(dryRun = false) {
  console.log('Starting searchableText migration...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log('');

  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    wouldUpdate: 0,
  };

  try {
    // Fetch all documents
    console.log('Fetching all documents from Firestore...');
    const snapshot = await firestore.collection('documents').get();
    stats.total = snapshot.size;

    console.log(`Found ${stats.total} documents to process`);
    console.log('');

    // Process each document
    for (const doc of snapshot.docs) {
      const docId = doc.id;
      const docData = doc.data();

      const result = await migrateDocument(docId, docData, dryRun);

      switch (result.status) {
        case 'updated':
          stats.updated++;
          break;
        case 'skipped':
          stats.skipped++;
          break;
        case 'would_update':
          stats.wouldUpdate++;
          break;
        case 'error':
          stats.errors++;
          break;
      }
    }

    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total documents:        ${stats.total}`);

    if (dryRun) {
      console.log(`Would update:           ${stats.wouldUpdate}`);
      console.log(`Already have field:     ${stats.skipped}`);
    } else {
      console.log(`Successfully updated:   ${stats.updated}`);
      console.log(`Skipped (already done): ${stats.skipped}`);
    }

    console.log(`Errors:                 ${stats.errors}`);
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('');
      console.log('This was a DRY RUN. To apply changes, run without --dry-run flag.');
    } else {
      console.log('');
      console.log('Migration completed successfully!');
    }

  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run migration
runMigration(dryRun)
  .then(() => {
    console.log('Script finished.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
