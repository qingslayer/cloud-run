import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
// The SDK will automatically find the credentials via the GOOGLE_APPLICATION_CREDENTIALS environment variable.
admin.initializeApp();

export default admin;
