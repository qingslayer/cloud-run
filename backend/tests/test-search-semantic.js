import fetch from 'node-fetch';
import { getIDToken } from './test-id-token.js';

const API_BASE_URL = 'http://localhost:8080/api';

async function testSemanticSearch() {
  console.log('--- Running test: Semantic Search (Summary) ---');
  const idToken = await getIDToken();
  const query = 'blood pressure readings';

  try {
    const response = await fetch(`${API_BASE_URL}/documents/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.type === 'summary') {
      console.log('✅ Test Passed: Received a "summary" response type.');
    } else {
      console.error('❌ Test Failed: Did not receive a "summary" response type.');
    }

  } catch (error) {
    console.error('❌ Test Failed with error:', error);
  }
}

testSemanticSearch();
