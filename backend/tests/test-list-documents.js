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

const API_BASE_URL = 'http://localhost:8080/api/documents';
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

// Get query parameters from command line
const category = process.argv[2];
const limit = process.argv[3];
const offset = process.argv[4];

async function testListDocuments() {
  try {
    // Step 1: Get fresh token from emulator
    console.log('🔐 Getting fresh token from Firebase Emulator...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const idToken = await userCredential.user.getIdToken();

    console.log(`✅ Token obtained (length: ${idToken.length})`);

    // Step 2: Construct URL with query parameters
    let url = API_BASE_URL;
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
