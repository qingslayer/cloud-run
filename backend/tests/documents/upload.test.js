import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import { getIDToken } from '../utils/id-token.test.js';
import { API_DOCUMENTS_URL } from '../utils/test-config.js';

// Get file path from command line
const filePath = process.argv[2];

async function testUpload() {
  if (!filePath) {
    console.error('Usage: node tests/documents/upload.test.js <path_to_file>');
    console.error('Example: node tests/documents/upload.test.js ~/Downloads/sample.png');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  try {
    // Step 1: Get fresh token from emulator
    const idToken = await getIDToken();

    // Step 2: Upload file
    console.log(`\n📤 Uploading file: ${filePath}`);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('category', 'test_category');
    form.append('name', 'Test Document from CLI');

    const response = await fetch(`${API_DOCUMENTS_URL}/upload`, {
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
