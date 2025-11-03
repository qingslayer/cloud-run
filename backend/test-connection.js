import 'dotenv/config';
import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

console.log('✨ Connection test complete!');
process.exit(0);