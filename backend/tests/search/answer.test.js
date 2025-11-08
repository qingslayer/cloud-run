import fetch from 'node-fetch';
import { getIDToken } from '../utils/id-token.test.js';
import { API_SEARCH_URL } from '../utils/config.test.js';

async function testAnswerSearch() {
  console.log('--- Running test: Answer Search ---');
  const idToken = await getIDToken();
  const query = 'what were my cholesterol levels?';

  try {
    const response = await fetch(API_SEARCH_URL, {
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

    if (response.status === 200 && data.type === 'answer') {
      console.log('✅ Test Passed: Received an "answer" response type.');
    } else {
      console.error('❌ Test Failed: Did not receive an "answer" response type.');
    }

  } catch (error) {
    console.error('❌ Test Failed with error:', error);
  }
}

testAnswerSearch();
