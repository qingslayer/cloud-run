import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import { getIDToken } from '../utils/id-token.test.js';
import { API_DOCUMENTS_URL } from '../utils/config.test.js';

// Get file path from command line
const filePath = process.argv[2];

async function testGetDocument() {
  if (!filePath) {
    console.error('Usage: node tests/documents/get-document.test.js <path_to_file>');
    console.error('Example: node tests/documents/get-document.test.js ~/Downloads/sample.png');
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
    form.append('category', 'test_get_document');
    form.append('name', 'Test Get Document from CLI');

    const uploadResponse = await fetch(`${API_DOCUMENTS_URL}/upload`, {
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

    const getResponse = await fetch(`${API_DOCUMENTS_URL}/${documentId}`, {
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
