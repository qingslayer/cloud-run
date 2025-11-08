import fetch from 'node-fetch';
import { getIDToken } from '../utils/id-token.test.js';
import { API_SEARCH_URL } from '../utils/test-config.js';

async function testChatSearch() {
  console.log('--- Running test: Chat Search ---');
  const idToken = await getIDToken();
  const query = 'why is my cholesterol high?';

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

    if (response.status === 200 && data.type === 'chat' && data.sessionId) {
      console.log('✅ Test Passed: Received a "chat" response type with a session ID.');
    } else {
      console.error('❌ Test Failed: Did not receive a "chat" response type or session ID.');
    }

  } catch (error) {
    console.error('❌ Test Failed with error:', error);
  }
}

testChatSearch();
