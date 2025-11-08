import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
import path from 'path';
import { Storage } from '@google-cloud/storage';
import { getIDToken } from '../utils/id-token.test.js';
import { API_DOCUMENTS_URL } from '../utils/test-config.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

// Get file path from command line
const filePath = process.argv[2];

async function testDeleteDocument() {
  if (!filePath) {
    console.error('Usage: node tests/documents/delete-document.test.js <path_to_file>');
    console.error('Example: node tests/documents/delete-document.test.js ~/Downloads/sample.png');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  let documentId;
  let storagePath;

  try {
    // Step 1: Get fresh token from emulator
    const idToken = await getIDToken();

    // Step 2: Upload a new file to get a document ID and storage path
    console.log(`\n📤 Uploading file to get a document ID: ${filePath}`);
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('category', 'test_delete_document');
    form.append('name', 'Test Delete Document from CLI');

    const uploadResponse = await fetch(`${API_DOCUMENTS_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${idToken}`, ...form.getHeaders() },
      body: form,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);

    documentId = uploadData.id;
    storagePath = uploadData.storagePath;
    console.log(`✅ File uploaded successfully. Document ID: ${documentId}, Storage Path: ${storagePath}`);

    // Step 3: Delete the document
    console.log(`\n🗑️ Deleting document with ID: ${documentId}`);
    const deleteResponse = await fetch(`${API_DOCUMENTS_URL}/${documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${idToken}` },
    });

    const deleteData = await deleteResponse.json();
    if (!deleteResponse.ok) throw new Error(`Delete failed: ${JSON.stringify(deleteData)}`);
    console.log('✅ Document deleted successfully from API.');

    // Step 4: Verify document is deleted from Firestore
    console.log(`\n🔎 Verifying document ${documentId} is deleted from Firestore...`);
    const verifyResponse = await fetch(`${API_DOCUMENTS_URL}/${documentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${idToken}` },
    });

    if (verifyResponse.status === 404) {
      console.log('✅ Verification successful: API returned 404 Not Found.');
    } else {
      throw new Error(`Verification failed: API returned status ${verifyResponse.status} instead of 404.`);
    }

    // Step 5: Verify file is deleted from Cloud Storage
    console.log(`\n🔎 Verifying file ${storagePath} is deleted from Cloud Storage...`);
    const storage = new Storage();
    const bucketName = process.env.STORAGE_BUCKET;
    const file = storage.bucket(bucketName).file(storagePath);
    const [exists] = await file.exists();

    if (!exists) {
      console.log('✅ Verification successful: File does not exist in Cloud Storage.');
    } else {
      throw new Error('Verification failed: File still exists in Cloud Storage.');
    }

    console.log('\n🎉 All tests passed! The delete feature is working correctly.');

  } catch (error) {
    console.error('\n❌ An error occurred during the test:', error.message);
    process.exit(1);
  }
}

testDeleteDocument();
