import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

// Ensure the server is running before executing this script.

const API_URL = 'http://localhost:8080/api/documents/upload';

// --- Configuration ---
// 1. Replace with the actual path to the file you want to upload
const filePath = process.argv[2]; // Get file path from command line argument
// 2. Replace with a valid Firebase ID token for your demo user
//    You can get this from your browser's developer console after logging in.
//    Look for network requests to your backend, or check localStorage/sessionStorage
//    for a key like 'firebaseIdToken' or similar.
const firebaseIdToken = process.argv[3]; // Get token from command line argument
// 3. Optional: Metadata for the document
const documentCategory = 'test_category';
const documentName = 'Test Document from CLI';
// --- End Configuration ---

async function testUpload() {
  if (!filePath || !firebaseIdToken) {
    console.error('Usage: node test-upload.js <path_to_file> <firebase_id_token>');
    console.error('Example: node test-upload.js ./sample.pdf your_firebase_id_token_here');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('category', documentCategory);
  form.append('name', documentName);

  try {
    console.log('Attempting to upload file...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        ...form.getHeaders(), // Important for multipart/form-data
      },
      body: form,
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Upload failed!');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ An error occurred during the upload process:', error);
  }
}

testUpload();