import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the backend root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Firebase Admin SDK
// Per Firebase docs: https://firebase.google.com/docs/admin/setup
// When using gcloud auth application-default login (ADC), Firebase Authentication
// requires the project ID to be explicitly provided on initialization.
// Using GOOGLE_CLOUD_PROJECT env var (Google Cloud standard).
if (!admin.apps.length) {
  const isProduction = process.env.NODE_ENV === 'production';
  // Use Google Cloud's standard environment variable
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'helpful-beach-476908-p3';
  const storageBucket = process.env.STORAGE_BUCKET || 'helpful-beach-476908-p3.firebasestorage.app';
  
  console.log('Using Firebase project:', projectId);

  let credential;

  if (isProduction) {
    // In production (e.g., Cloud Run), use Application Default Credentials
    console.log('Initializing Firebase Admin SDK for PRODUCTION with Application Default Credentials...');
    credential = admin.credential.applicationDefault();
  } else {
    // In development, use the service account key or ADC
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (serviceAccountPath) {
      console.log('Initializing Firebase Admin SDK for DEVELOPMENT with service account key...');
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
      console.log('Initializing Firebase Admin SDK for DEVELOPMENT with Application Default Credentials (ADC)...');
      credential = admin.credential.applicationDefault();
    }
  }

  admin.initializeApp({
    credential,
    storageBucket,
  });
}

export default admin;
