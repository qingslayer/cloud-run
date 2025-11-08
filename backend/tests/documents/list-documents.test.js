import fetch from 'node-fetch';
import { getIDToken } from '../utils/id-token.test.js';
import { API_DOCUMENTS_URL } from '../utils/test-config.js';

// Get query parameters from command line
const category = process.argv[2];
const limit = process.argv[3];
const offset = process.argv[4];

async function testListDocuments() {
  try {
    // Step 1: Get fresh token from emulator
    const idToken = await getIDToken();

    // Step 2: Construct URL with query parameters
    let url = API_DOCUMENTS_URL;
    const queryParams = [];
    if (category) queryParams.push(`category=${category}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (offset) queryParams.push(`offset=${offset}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    console.log(`
Fetching documents from: ${url}`);

    // Step 3: Make GET request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log(); // Add a newline for spacing
      console.log('✅ Documents fetched successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(); // Add a newline for spacing
      console.error('❌ Failed to fetch documents!');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ An error occurred:', error.message);
  }
}

testListDocuments();
