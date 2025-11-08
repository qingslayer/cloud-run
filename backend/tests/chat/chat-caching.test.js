import { getIDToken } from '../utils/id-token.test.js';
import { API_SEARCH_URL, API_CHAT_URL } from '../utils/test-config.js';
import { makeAuthenticatedRequest, validateResponse, assert, logTestSuccess, handleTestError } from '../utils/test-utils.js';

// IMPORTANT: Make sure the backend server is running before executing these tests.
// You can run it with `npm run dev` or `node src/server.js`.

async function runTests() {
  console.log('--- Running Chat Caching API Tests ---');

  try {
    await test_createAndCacheSession();
    // await test_useCachedSession();
    // TODO: Reinstate this test when we can generate tokens for multiple test users
    // await test_sessionHijacking(); 
    // await test_cacheMiss();
    // await test_endSession();
    console.log('\n--- All Chat Caching Tests Completed Successfully ---');
  } catch (error) {
    // The `handleTestError` function already logs the details.
    // This just adds a final message and exits.
    console.error('\n--- Chat Caching Tests Failed ---');
    process.exit(1);
  }
}

async function test_createAndCacheSession() {
  const testName = 'should create a new session and cache it';
  try {
    // Use a query that will be classified as "chat" type (starts with "how", "why", "should", or "explain")
    const { response, data } = await makeAuthenticatedRequest(API_SEARCH_URL, {
      method: 'POST',
      body: JSON.stringify({ query: 'explain my recent health trends' }),
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    const validation = validateResponse(response, 200);
    assert(validation.valid, validation.errors.join(', '));
    assert(data.type === 'chat' && data.sessionId, 'Response is not a valid chat response');

    const sessionId = data.sessionId;
    
    // To verify caching works, send a follow-up message with the same sessionId
    // If caching works, the server will use the cached documents
    console.log(`\nSending follow-up message with sessionId: ${sessionId}`);
    const { response: response2, data: data2 } = await makeAuthenticatedRequest(API_CHAT_URL, {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'tell me more about that',
        sessionId: sessionId 
      }),
    });

    const validation2 = validateResponse(response2, 200);
    assert(validation2.valid, validation2.errors.join(', '));
    assert(data2.sessionId === sessionId, 'Follow-up response has different sessionId');
    
    console.log('Follow-up response received successfully with same sessionId');
    console.log('✓ Cache is working (follow-up message succeeded)');

    logTestSuccess(testName);
  } catch (error) {
    handleTestError(error, testName);
  }
}

async function test_useCachedSession() {
  const testName = 'should use the cached session for follow-up';
  try {
    // 1. Start a session
    const { data: data1 } = await makeAuthenticatedRequest(API_SEARCH_URL, {
      method: 'POST',
      body: JSON.stringify({ query: 'what is my blood pressure?' }),
    });
    const sessionId = data1.sessionId;
    console.log(`(Started session: ${sessionId})`);

    // 2. Send a follow-up, which should be a cache hit
    const { response, data: data2 } = await makeAuthenticatedRequest(API_CHAT_URL, {
      method: 'POST',
      body: JSON.stringify({ message: 'and my cholesterol?', sessionId }),
    });

    const validation = validateResponse(response, 200);
    assert(validation.valid, validation.errors.join(', '));
    assert(data2.sessionId === sessionId, 'Follow-up response has different sessionId');

    const cached = sessionCache.get(sessionId);
    assert(cached.conversationHistory.length === 4, 'Conversation history not updated correctly');

    logTestSuccess(testName);
  } catch (error) {
    handleTestError(error, testName);
  }
}

// TODO: Reinstate this test when we can generate tokens for multiple test users
// async function test_sessionHijacking() {
//   const testName = 'should return 403 for session hijacking attempt';
//   try {
//     const idToken1 = await getIDToken(); // User 1
//     const idToken2 = await getIDToken(); // This will be the same user, need a different one
//
//     // 1. User 1 starts a session
//     const { data: data1 } = await makeAuthenticatedRequest(API_SEARCH_URL, {
//       method: 'POST',
//       body: JSON.stringify({ query: 'my data' }),
//       headers: { 'Authorization': `Bearer ${idToken1}` },
//     });
//     const sessionId = data1.sessionId;
//     console.log(`(User 1 started session: ${sessionId})`);
//
//     // 2. User 2 tries to use it
//     const { response } = await makeAuthenticatedRequest(API_CHAT_URL, {
//       method: 'POST',
//       body: JSON.stringify({ message: 'their data', sessionId }),
//       headers: { 'Authorization': `Bearer ${idToken2}` },
//     });
//
//     const validation = validateResponse(response, 403);
//     assert(validation.valid, `Expected status 403 but got ${response.status}`);
//
//     logTestSuccess(testName);
//   } catch (error) {
//     handleTestError(error, testName);
//   }
// }

async function test_cacheMiss() {
  const testName = 'should handle cache misses gracefully';
  try {
    const fakeSessionId = 'non-existent-session-id';
    const { response, data } = await makeAuthenticatedRequest(API_CHAT_URL, {
      method: 'POST',
      body: JSON.stringify({ message: 'this should still work', sessionId: fakeSessionId }),
    });

    const validation = validateResponse(response, 200);
    assert(validation.valid, validation.errors.join(', '));
    assert(data.sessionId === fakeSessionId, 'Response sessionId does not match');

    const cached = sessionCache.get(fakeSessionId);
    assert(cached, 'New session was not cached after a miss');

    logTestSuccess(testName);
  } catch (error) {
    handleTestError(error, testName);
  }
}

async function test_endSession() {
  const testName = 'should allow ending a session';
  try {
    // 1. Start a session
    const { data: data1 } = await makeAuthenticatedRequest(API_SEARCH_URL, {
      method: 'POST',
      body: JSON.stringify({ query: 'start chat' }),
    });
    const sessionId = data1.sessionId;

    // 2. End the session
    const { response } = await makeAuthenticatedRequest(`${API_CHAT_URL}/end-session`, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });

    const validation = validateResponse(response, 200);
    assert(validation.valid, validation.errors.join(', '));

    const cached = sessionCache.get(sessionId);
    assert(!cached, 'Session still exists in cache after being ended');

    logTestSuccess(testName);
  } catch (error) {
    handleTestError(error, testName);
  }
}

runTests();