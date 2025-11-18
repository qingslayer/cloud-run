import { Storage } from '@google-cloud/storage';

// Get project ID from environment variable with fallback
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'helpful-beach-476908-p3';

// Create singleton Storage instance
// This ensures only one connection is created and reused across the application
export const storage = new Storage({ projectId });

console.log(`✅ Storage singleton initialized for project: ${projectId}`);
