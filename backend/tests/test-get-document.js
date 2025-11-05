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

async function testGetDocument() {
  if (!filePath) {
    console.error('Usage: node tests/test-get-document.js <path_to_file>');
    console.error('Example: node tests/test-get-document.js ~/Downloads/sample.png');
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
    form.append('category', 'test_get_document');
    form.append('name', 'Test Get Document from CLI');

    const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }

    documentId = uploadData.id;
    console.log(`✅ File uploaded successfully. Document ID: ${documentId}`);

    // Step 3: Fetch the document by ID
    console.log(`\n🔎 Fetching document with ID: ${documentId}`);

    const getResponse = await fetch(`${API_BASE_URL}/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    const getData = await getResponse.json();

    if (getResponse.ok) {
      console.log('\n✅ Document fetched successfully!');
      console.log('Response:', JSON.stringify(getData, null, 2));
      if (getData.downloadUrl) {
        console.log('\n✅ Download URL is present.');
      } else {
        console.error('\n❌ Download URL is missing!');
      }
    } else {
      console.error('\n❌ Failed to fetch document!');
      console.error('Status:', getResponse.status);
      console.error('Response:', JSON.stringify(getData, null, 2));
    }
  } catch (error) {
    console.error('❌ An error occurred:', error.message);
  }
}

testGetDocument();
