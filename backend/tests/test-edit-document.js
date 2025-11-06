import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

// Firebase config for getting token
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: `${process.env.PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.PROJECT_ID,
  storageBucket: `${process.env.PROJECT_ID}.appspot.com`,
};

const API_BASE_URL = 'http://localhost:8080/api/documents';
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

// Get file path from command line
const filePath = process.argv[2];

async function testEditDocument() {
  if (!filePath) {
    console.error('Usage: node tests/test-edit-document.js <path_to_file>');
    console.error('Example: node tests/test-edit-document.js ~/Downloads/sample.png');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  let idToken;
  let documentId;

  try {
    // Step 1: Get fresh token from emulator
    console.log('🔐 Getting fresh token from Firebase Emulator...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    idToken = await userCredential.user.getIdToken();
    console.log(`✅ Token obtained (length: ${idToken.length})`);

    // Step 2: Upload a new file to get a document ID
    console.log(`\n📤 Uploading file to get a document ID: ${filePath}`);
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${idToken}`, ...form.getHeaders() },
      body: form,
    });
    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    documentId = uploadData.id;
    console.log(`✅ File uploaded successfully. Document ID: ${documentId}`);

    // Step 3: Edit the document
    const updates = {
      displayName: 'My Awesome Test Document',
      category: 'edited_category',
      notes: 'These are some updated notes.',
    };
    console.log(`\n✏️ Editing document with ID: ${documentId}`);
    console.log('   Updates:', updates);
    const editResponse = await fetch(`${API_BASE_URL}/${documentId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const editData = await editResponse.json();
    if (!editResponse.ok) throw new Error(`Edit failed: ${JSON.stringify(editData)}`);
    console.log('✅ Document edited successfully.');

    // Step 4: Verify the updates
    console.log(`\n🔎 Verifying updates for document ${documentId}...`);
    if (
      editData.displayName === updates.displayName &&
      editData.category === updates.category &&
      editData.notes === updates.notes &&
      editData.lastModified
    ) {
      console.log('✅ Verification successful: All fields updated correctly.');
      console.log('   - displayName:', editData.displayName);
      console.log('   - category:', editData.category);
      console.log('   - notes:', editData.notes);
      console.log('   - lastModified:', editData.lastModified);
    } else {
      throw new Error(`Verification failed. Expected ${JSON.stringify(updates)}, but got ${JSON.stringify(editData)}`);
    }

    // Step 5: Test immutable field update
    console.log(`\n🛡️ Testing immutable field update for document ${documentId}...`);
    const immutableUpdate = { filename: 'new-filename.txt' };
    const immutableResponse = await fetch(`${API_BASE_URL}/${documentId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(immutableUpdate),
    });
    if (immutableResponse.status === 400) {
        console.log('✅ Test successful: API returned 400 Bad Request for immutable field update.');
    } else {
        throw new Error(`Immutable field test failed: API returned status ${immutableResponse.status} instead of 400.`);
    }

    console.log('\n🎉 All tests passed! The edit feature is working correctly.');

  } catch (error) {
    console.error('\n❌ An error occurred during the test:', error.message);
    process.exit(1);
  }
}

testEditDocument();
