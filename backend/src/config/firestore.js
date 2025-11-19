import { Firestore } from '@google-cloud/firestore';

// Get project ID from environment variable with fallback
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'helpful-beach-476908-p3';

// Create singleton Firestore instance
// This ensures only one connection is created and reused across the application
export const firestore = new Firestore({ projectId });

console.log(`✅ Firestore singleton initialized for project: ${projectId}`);
