import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
// Per Firebase docs: https://firebase.google.com/docs/admin/setup
// When using gcloud auth application-default login (ADC), Firebase Authentication
// requires the project ID to be explicitly provided on initialization.
// Using GOOGLE_CLOUD_PROJECT or PROJECT_ID env var avoids hardcoding the project ID.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID,
  });
}

export default admin;
