import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables (only in non-production environments)
// In production (Cloud Run), environment variables are set by Cloud Run
// and should not be overwritten by .env file
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Enable CORS for all routes
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * Health check endpoint
 * Returns server status and configuration info
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

import authMiddleware from './middleware/auth.js';
import documentsRouter from './routes/documents.js';
import chatRouter from './routes/chat.js';
import usersRouter from './routes/users.js';

const apiRouter = express.Router();

// Secure all API routes with the authentication middleware
apiRouter.use(authMiddleware);

// Mount the modular routers
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/users', usersRouter);

// Mount the main API router
app.use('/api', apiRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
});

