import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';

// Load environment variables
dotenv.config();

// Firebase config for getting token
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: `${process.env.PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.PROJECT_ID,
  storageBucket: `${process.env.PROJECT_ID}.appspot.com`,
};

const API_URL = 'http://localhost:8080/api/documents/upload';
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

// Get file path from command line
const filePath = process.argv[2];

async function testUpload() {
  if (!filePath) {
    console.error('Usage: node tests/test-upload.js <path_to_file>');
    console.error('Example: node tests/test-upload.js ~/Downloads/sample.png');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  try {
    // Step 1: Get fresh token from emulator
    console.log('🔐 Getting fresh token from Firebase Emulator...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const idToken = await userCredential.user.getIdToken();
    
    console.log(`✅ Token obtained (length: ${idToken.length})`);

    // Step 2: Upload file
    console.log(`\n📤 Uploading file: ${filePath}`);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('category', 'test_category');
    form.append('name', 'Test Document from CLI');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Upload successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('\n❌ Upload failed!');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ An error occurred:', error.message);
  }
}

testUpload();
