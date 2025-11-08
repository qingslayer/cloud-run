// Firebase client-side SDK imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import dotenv from 'dotenv';
import { TEST_EMAIL, TEST_PASSWORD, AUTH_EMULATOR_URL } from './test-config.js';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: "demo-api-key", // Emulator doesn't validate this
  authDomain: `${process.env.PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.PROJECT_ID,
  storageBucket: `${process.env.PROJECT_ID}.appspot.com`,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to the local authentication emulator
connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });

export async function getIDToken() {
  try {
    console.log(`\n🔐 Attempting to sign in with ${TEST_EMAIL} using the Firebase Emulator...`);
    console.log(`📍 Project ID: ${firebaseConfig.projectId}`);
    console.log(`🌐 Auth Emulator: ${AUTH_EMULATOR_URL}\n`);
    
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const idToken = await userCredential.user.getIdToken();

    console.log("✅ Successfully obtained Firebase ID Token from Emulator!");
    console.log("\n" + "=".repeat(70));
    console.log("ID TOKEN:");
    console.log("=".repeat(70));
    console.log(idToken);
    console.log("=".repeat(70) + "\n");
    
    console.log("💡 You can now use this token to test your authenticated endpoints:");
    console.log(`   curl -H "Authorization: Bearer ${idToken.substring(0, 50)}..." http://localhost:3000/api/your-endpoint\n`);
    
    return idToken;
  } catch (error) {
    console.error("\n❌ Error getting ID Token from Emulator");
    console.error("Error:", error.message);
    console.error("\n💡 Make sure:");
    console.error("   1. Firebase emulators are running (firebase emulators:start)");
    console.error("   2. You've created a test user in the Auth Emulator UI");
    console.error("      - Go to http://localhost:9000");
    console.error("      - Click 'Authentication' section");
    console.error("      - Add user with email:", TEST_EMAIL);
    console.error("      - And password:", TEST_PASSWORD);
    console.error("\n");
    throw error;
  }
}

// If running this file directly (not imported), execute the function
if (import.meta.url === `file://${process.argv[1]}`) {
  getIDToken();
}
