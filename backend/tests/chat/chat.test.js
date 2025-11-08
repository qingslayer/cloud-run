import fetch from 'node-fetch';
import { getIDToken } from '../utils/id-token.test.js';
import { API_CHAT_URL } from '../utils/config.test.js';

async function testChat() {
  console.log('--- Running test: Conversational Chat ---');
  const idToken = await getIDToken();
  let sessionId = null;
  let conversationHistory = [];

  // First message
  let message = 'What was my last cholesterol reading?';
  console.log(`\n--- Sending message: "${message}" ---`);

  try {
    let response = await fetch(API_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    let data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.sessionId) {
      console.log('✅ Test Passed: Received a response with a session ID.');
      sessionId = data.sessionId;
      conversationHistory.push({ role: 'user', text: message });
      conversationHistory.push({ role: 'model', text: data.answer });
    } else {
      console.error('❌ Test Failed: Did not receive a response with a session ID.');
      return;
    }

  } catch (error) {
    console.error('❌ Test Failed with error:', error);
    return;
  }

  // Follow-up message
  message = 'Was that considered high?';
  console.log(`\n--- Sending follow-up message: "${message}" ---`);

  try {
    let response = await fetch(API_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sessionId, conversationHistory }),
    });

    let data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.sessionId === sessionId) {
      console.log('✅ Test Passed: Received a follow-up response with the same session ID.');
    } else {
      console.error('❌ Test Failed: Did not receive a follow-up response with the same session ID.');
    }

  } catch (error) {
    console.error('❌ Test Failed with error:', error);
  }
}

testChat();
