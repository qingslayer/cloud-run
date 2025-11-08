import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
import path from 'path';
import { getIDToken } from '../utils/id-token.test.js';
import { API_DOCUMENTS_URL } from '../utils/config.test.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

// Get file path from command line
const filePath = process.argv[2];

async function testAnalyzeDocument() {
  if (!filePath) {
    console.error('Usage: node tests/documents/analyze-document.test.js <path_to_file>');
    console.error('Example: node tests/documents/analyze-document.test.js ~/Downloads/sample-lab-report.pdf');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  let documentId;

  try {
    // Step 1: Get fresh token from emulator
    const idToken = await getIDToken();

    // Step 2: Upload a new file to get a document ID
    console.log(`\n📤 Uploading file to get a document ID: ${filePath}`);
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    const uploadResponse = await fetch(`${API_DOCUMENTS_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${idToken}`, ...form.getHeaders() },
      body: form,
    });
    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    documentId = uploadData.id;
    console.log(`✅ File uploaded successfully. Document ID: ${documentId}`);

    // Step 3: Trigger the analysis
    console.log(`\n🤖 Triggering AI analysis for document ID: ${documentId}`);
    const analyzeResponse = await fetch(`${API_DOCUMENTS_URL}/${documentId}/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${idToken}` },
    });
    const analysisData = await analyzeResponse.json();
    if (!analyzeResponse.ok) throw new Error(`Analysis failed: ${JSON.stringify(analysisData)}`);
    console.log('✅ Analysis completed successfully.');

    // Step 4: Verify the results
    console.log(`\n🔎 Verifying analysis results...`);
    let verificationPassed = true;

    if (!analysisData.displayName) {
      console.error('❌ Verification failed: displayName is missing.');
      verificationPassed = false;
    } else {
      console.log(`   - displayName: "${analysisData.displayName}"`);
    }

    if (!analysisData.category || analysisData.category === 'uncategorized') {
      console.error('❌ Verification failed: category is missing or un-categorized.');
      verificationPassed = false;
    } else {
      console.log(`   - category: "${analysisData.category}"`);
    }

    if (!analysisData.extractedText) {
      console.error('❌ Verification failed: extractedText is missing.');
      verificationPassed = false;
    } else {
      console.log(`   - extractedText: (length: ${analysisData.extractedText.length})`);
    }

    if (!analysisData.aiAnalysis) {
      console.error('❌ Verification failed: aiAnalysis object is missing.');
      verificationPassed = false;
    } else {
      console.log('   - aiAnalysis object is present.');
    }
    
    if (!analysisData.analyzedAt) {
      console.error('❌ Verification failed: analyzedAt timestamp is missing.');
      verificationPassed = false;
    } else {
      console.log(`   - analyzedAt: ${analysisData.analyzedAt._seconds}s`);
    }

    if (verificationPassed) {
      console.log('\n🎉 All tests passed! The analyze feature is working correctly.');
    } else {
      throw new Error('Some verifications failed. See logs above.');
    }

  } catch (error) {
    console.error('\n❌ An error occurred during the test:', error.message);
    process.exit(1);
  }
}

testAnalyzeDocument();
