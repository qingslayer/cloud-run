import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
// Per Firebase docs: https://firebase.google.com/docs/admin/setup
// When using gcloud auth application-default login (ADC), Firebase Authentication
// requires the project ID to be explicitly provided on initialization.
// Using GOOGLE_CLOUD_PROJECT or PROJECT_ID env var avoids hardcoding the project ID.
if (!admin.apps.length) {
  const isProduction = process.env.NODE_ENV === 'production';
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID;
  const storageBucket = process.env.STORAGE_BUCKET;

  let credential;

  if (isProduction) {
    // In production (e.g., Cloud Run), use Application Default Credentials
    console.log('Initializing Firebase Admin SDK for PRODUCTION with Application Default Credentials...');
    credential = admin.credential.applicationDefault();
  } else {
    // In development, use the service account key
    console.log('Initializing Firebase Admin SDK for DEVELOPMENT with service account key...');
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set for development.');
    }
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
  }

  admin.initializeApp({
    credential,
    projectId,
    storageBucket,
  });
}

export default admin;
