import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

// ============================================================================
// STARTUP DIAGNOSTICS - Debug logging for Cloud Run deployment issues
// ============================================================================
console.log('='.repeat(80));
console.log('--- FIREBASE CONFIG STARTUP DEBUG ---');
console.log('='.repeat(80));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`Current working directory (process.cwd()): ${process.cwd()}`);
console.log(`dirname of this file (__dirname): ${__dirname}`);

// List relevant environment variables BEFORE dotenv.config
console.log('\nEnvironment variables BEFORE dotenv.config:');
console.log(`  NODE_ENV: '${process.env.NODE_ENV}'`);
console.log(`  GOOGLE_CLOUD_PROJECT: '${process.env.GOOGLE_CLOUD_PROJECT}'`);
console.log(`  GOOGLE_APPLICATION_CREDENTIALS: '${process.env.GOOGLE_APPLICATION_CREDENTIALS}'`);
console.log(`  K_SERVICE: '${process.env.K_SERVICE}'`);
console.log(`  STORAGE_BUCKET: '${process.env.STORAGE_BUCKET}'`);

// Check for the .env file
const potentialEnvPath = path.resolve(__dirname, '../../.env');
console.log(`\nChecking for .env file at: ${potentialEnvPath}`);
try {
    const envFileStats = fs.statSync(potentialEnvPath);
    console.log(`⚠️  .env file FOUND!`);
    console.log(`⚠️  .env file size: ${envFileStats.size} bytes`);
    console.log(`⚠️  WARNING: .env file should NOT be deployed to production!`);
} catch (error) {
    console.log(`✅ .env file NOT found (this is expected in production): ${error.message}`);
}

// Check for the problematic service account key file
const problematicServiceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (problematicServiceAccountPath) {
    console.log(`\n⚠️  GOOGLE_APPLICATION_CREDENTIALS is set to: ${problematicServiceAccountPath}`);
    if (problematicServiceAccountPath.startsWith('/Users/')) {
        console.log(`❌ PROBLEM DETECTED: Path points to local development machine!`);
        console.log(`   Attempting to check if file exists...`);
        try {
            const fileStat = fs.statSync(problematicServiceAccountPath);
            console.log(`   File FOUND (unexpected in Cloud Run!): ${JSON.stringify(fileStat)}`);
        } catch (error) {
            console.log(`   File NOT found (expected in Cloud Run): ${error.message}`);
        }
    }
} else {
    console.log(`\n✅ GOOGLE_APPLICATION_CREDENTIALS is NOT set (expected for ADC)`);
}

console.log('='.repeat(80));
console.log('--- END STARTUP DEBUG ---');
console.log('='.repeat(80));

// Load environment variables (only in non-production environments)
// In production (Cloud Run), environment variables are set by Cloud Run
// and should not be overwritten by .env file
if (process.env.NODE_ENV !== 'production') {
  console.log('\n🔧 Loading .env file (development mode)...');
  dotenv.config({ path: potentialEnvPath });

  // Log environment variables AFTER dotenv.config
  console.log('\nEnvironment variables AFTER dotenv.config:');
  console.log(`  NODE_ENV: '${process.env.NODE_ENV}'`);
  console.log(`  GOOGLE_CLOUD_PROJECT: '${process.env.GOOGLE_CLOUD_PROJECT}'`);
  console.log(`  GOOGLE_APPLICATION_CREDENTIALS: '${process.env.GOOGLE_APPLICATION_CREDENTIALS}'`);
} else {
  console.log('\n✅ Skipping .env file load (production mode)');
}

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================
// Per Firebase docs: https://firebase.google.com/docs/admin/setup
// In Cloud Run, use Application Default Credentials (ADC) which automatically
// uses the service account attached to the Cloud Run service.
if (!admin.apps.length) {
  console.log('\n' + '='.repeat(80));
  console.log('--- FIREBASE INITIALIZATION ---');
  console.log('='.repeat(80));

  // Check for production environment - Cloud Run sets K_SERVICE, PORT, or we check NODE_ENV
  // Also check if we're running in a Cloud Run environment (has K_SERVICE env var)
  const isCloudRun = !!process.env.K_SERVICE;
  const isProduction = process.env.NODE_ENV === 'production' || isCloudRun;

  // Use Google Cloud's standard environment variable
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'helpful-beach-476908-p3';
  const storageBucket = process.env.STORAGE_BUCKET || 'helpful-beach-476908-p3.firebasestorage.app';

  console.log('Environment detection:', {
    NODE_ENV: process.env.NODE_ENV,
    K_SERVICE: process.env.K_SERVICE,
    isCloudRun,
    isProduction,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET'
  });

  console.log(`\nUsing Firebase project: ${projectId}`);
  console.log(`Using storage bucket: ${storageBucket}`);
  
  if (isProduction) {
    // In Cloud Run, ALWAYS use Application Default Credentials
    // NEVER try to load a file, even if GOOGLE_APPLICATION_CREDENTIALS is set
    console.log('\n🚀 PRODUCTION PATH: Initializing Firebase Admin SDK with Application Default Credentials...');
    console.log('   This will use the service account attached to Cloud Run');

    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket,
      });

      console.log('✅ Firebase Admin SDK initialized successfully using ADC');
      console.log('='.repeat(80));
    } catch (error) {
      console.error('❌ FATAL: Failed to initialize Firebase Admin SDK in production!');
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      console.log('='.repeat(80));
      throw error;
    }
  } else {
    // For local development, try to load a service account key file if available
    // Otherwise, fall back to Application Default Credentials (requires gcloud auth)
    console.log('\n🔧 DEVELOPMENT PATH: Checking for service account key file...');
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountPath) {
      console.log(`   GOOGLE_APPLICATION_CREDENTIALS is set to: ${serviceAccountPath}`);
      console.log(`   Checking if file exists...`);
    } else {
      console.log(`   GOOGLE_APPLICATION_CREDENTIALS is NOT set`);
    }

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      console.log(`   ✅ Service account key file found!`);
      console.log(`   Attempting to load and initialize with key file...`);

      try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket,
        });

        console.log('✅ Firebase Admin SDK initialized using local key file');
        console.log('='.repeat(80));
      } catch (error) {
        console.error('❌ Failed to load service account key:', error.message);
        console.error(`   Stack: ${error.stack}`);
        console.log('   Falling back to Application Default Credentials...');

        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            storageBucket,
          });
          console.log('✅ Firebase Admin SDK initialized using ADC fallback');
          console.log('='.repeat(80));
        } catch (adcError) {
          console.error('❌ FATAL: ADC fallback also failed!');
          console.error(`   Error: ${adcError.message}`);
          console.log('='.repeat(80));
          throw adcError;
        }
      }
    } else {
      if (serviceAccountPath) {
        console.warn(`   ⚠️  Service account key file NOT FOUND at: ${serviceAccountPath}`);
      } else {
        console.log(`   ℹ️  No service account key specified`);
      }
      console.log('   Using Application Default Credentials (ADC)...');
      console.log('   (Requires: gcloud auth application-default login)');

      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          storageBucket,
        });

        console.log('✅ Firebase Admin SDK initialized using ADC');
        console.log('='.repeat(80));
      } catch (error) {
        console.error('❌ FATAL: Failed to initialize with ADC!');
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        console.log('   Hint: Run "gcloud auth application-default login"');
        console.log('='.repeat(80));
        throw error;
      }
    }
  }

  // Configure Auth Emulator if environment variable is set
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log(`🔧 Using Firebase Auth Emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    // No need to call connectAuthEmulator - the env var is automatically detected by Firebase Admin SDK
  }
}

export default admin;
