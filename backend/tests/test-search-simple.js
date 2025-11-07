import fetch from 'node-fetch';
import { getIDToken } from './test-id-token.js';

const API_BASE_URL = 'http://localhost:8080/api';

async function testSimpleSearch() {
  console.log('--- Running test: Simple Search (No AI) ---');
  const idToken = await getIDToken();
  const query = 'show all prescriptions';

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

    if (response.status === 200 && data.type === 'documents') {
      console.log('✅ Test Passed: Received a "documents" response type.');
    } else {
      console.error('❌ Test Failed: Did not receive a "documents" response type.');
    }

  } catch (error) {
    console.error('❌ Test Failed with error:', error);
  }
}

testSimpleSearch();
