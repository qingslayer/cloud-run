import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';

// Load environment variables
dotenv.config();

// Firebase config for getting token
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: `${process.env.PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.PROJECT_ID,
  storageBucket: `${process.env.PROJECT_ID}.appspot.com`,
};

const API_BASE_URL = 'http://localhost:8080/api';
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

async function testSearch(query, idToken) {
  console.log(`\n--- Testing search with query: "${query}" ---`);
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    console.log('Search response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.type === 'answer') {
      console.log(`\n✅ AI Answer Received: ${data.answer.substring(0, 100)}...`);
    } else if (data.type === 'documents') {
      console.log(`\n✅ Document-based Search Returned ${data.documents.length} documents.`);
    }

  } catch (error) {
    console.error('Error testing search:', error.message);
  }
}

async function runTests() {
  try {
    // Get fresh token from emulator
    console.log('🔐 Getting fresh token from Firebase Emulator...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const idToken = await userCredential.user.getIdToken();
    console.log(`✅ Token obtained (length: ${idToken.length})\n`);

    // Test 1: A simple keyword search that should not trigger AI
    await testSearch('LabCorp', idToken);

    // Test 2: A question that should trigger the AI Q&A
    await testSearch('What was my glucose level?', idToken);

    // Test 3: A keyword search that should match a specific finding
    await testSearch('Hemoglobin', idToken);

    // Test 4: A broader question for the AI
    await testSearch('Summarize my recent blood work results', idToken);

  } catch (error) {
    console.error('❌ An error occurred:', error.message);
  }
}

runTests();
