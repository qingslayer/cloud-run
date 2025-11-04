import dotenv from 'dotenv';
dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['GEMINI_API_KEY', 'PROJECT_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please ensure your .env file is correctly configured in the backend directory.');
  process.exit(1);
}

import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from './src/config/firebase.js';

console.log('🧪 Testing GCP connections...\n');

// Test Gemini
console.log('Testing Gemini API...');
try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const result = await model.generateContent("Say hello in one word");
  const text = result.response.text();
  console.log('✅ Gemini API connected');
  console.log(`   Response: ${text}\n`);
} catch (error) {
  console.log('❌ Gemini error:', error.message, '\n');
}

// Test Cloud Storage
console.log('Testing Cloud Storage...');
try {
  const storage = new Storage({ projectId: process.env.PROJECT_ID });
  const [buckets] = await storage.getBuckets();
  console.log('✅ Cloud Storage connected');
  console.log(`   Found ${buckets.length} bucket(s):`);
  buckets.forEach(bucket => console.log(`   - ${bucket.name}`));
  console.log();
} catch (error) {
  console.log('❌ Storage error:', error.message, '\n');
}

// Test Firestore
console.log('Testing Firestore...');
try {
  const firestore = new Firestore({ projectId: process.env.PROJECT_ID });
  await firestore.collection('_test').limit(1).get();
  console.log('✅ Firestore connected\n');
} catch (error) {
  console.log('❌ Firestore error:', error.message, '\n');
}

// Test Firebase Admin SDK
console.log('Testing Firebase Admin SDK...');
let adminSdkSuccess = true;
try {
  // Check if admin is initialized
  if (admin.apps.length > 0) {
    console.log(`   Project ID: ${admin.app().options.projectId}`);
  }
  
  // Test 1: Firestore through Admin SDK
  const firestoreAdmin = admin.firestore();
  await firestoreAdmin.collection('_test').limit(1).get();
  console.log('   ✓ Firestore service works');
  
  // Test 2: Firebase Authentication
  try {
    const authService = admin.auth();
    await authService.listUsers(1);
    console.log('   ✓ Authentication service works');
  } catch (authError) {
    if (authError.code === 'auth/configuration-not-found') {
      console.log('   ⚠️  Authentication service not configured');
      console.log('      To enable: Visit https://console.firebase.google.com/project/' + admin.app().options.projectId + '/authentication');
    } else {
      throw authError;
    }
  }
  
  console.log('✅ Firebase Admin SDK connected\n');
} catch (error) {
  adminSdkSuccess = false;
  console.log('❌ Firebase Admin SDK error:', error.message);
  console.log('   Error code:', error.code, '\n');
}

console.log('✨ Connection test complete!');
process.exit(0);