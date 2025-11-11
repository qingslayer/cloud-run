import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

// Load environment variables (only in non-production environments)
// In production (Cloud Run), environment variables are set by Cloud Run
// and should not be overwritten by .env file
if (process.env.NODE_ENV !== 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

// Initialize Firebase Admin SDK
// Per Firebase docs: https://firebase.google.com/docs/admin/setup
// In Cloud Run, use Application Default Credentials (ADC) which automatically
// uses the service account attached to the Cloud Run service.
if (!admin.apps.length) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Use Google Cloud's standard environment variable
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'helpful-beach-476908-p3';
  const storageBucket = process.env.STORAGE_BUCKET || 'helpful-beach-476908-p3.firebasestorage.app';
  
  if (isProduction) {
    // In Cloud Run, the Firebase Admin SDK should automatically pick up
    // the attached service account credentials.
    // Ensure the Cloud Run service account has the necessary Firebase roles.
    console.log('Initializing Firebase Admin SDK for PRODUCTION with Application Default Credentials...');
    console.log('Using Firebase project:', projectId);
    
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket,
    });
    
    console.log('✅ Firebase Admin SDK initialized using application default credentials.');
  } else {
    // For local development, try to load a service account key file if available
    // Otherwise, fall back to Application Default Credentials (requires gcloud auth)
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      console.log('Initializing Firebase Admin SDK for DEVELOPMENT with service account key...');
      console.log('Using Firebase project:', projectId);
      
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket,
      });
      
      console.log('✅ Firebase Admin SDK initialized using local key file.');
    } else {
      console.log('Initializing Firebase Admin SDK for DEVELOPMENT with Application Default Credentials (ADC)...');
      console.log('Using Firebase project:', projectId);
      console.warn('⚠️  No service account key found. Using ADC (requires: gcloud auth application-default login)');
      
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket,
      });
      
      console.log('✅ Firebase Admin SDK initialized using application default credentials.');
    }
  }

  // Configure Auth Emulator if environment variable is set
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log(`🔧 Using Firebase Auth Emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    // No need to call connectAuthEmulator - the env var is automatically detected by Firebase Admin SDK
  }
}

export default admin;
