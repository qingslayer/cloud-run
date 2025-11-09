import admin from '../config/firebase.js';

/**
 * Express middleware to verify Firebase ID token.
 * If the token is valid, the decoded user is attached to `req.user`.
 * Otherwise, it sends a 401 or 403 response.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No Firebase ID token was passed as a Bearer token in the Authorization header.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // When using Firebase Auth Emulator, verifyIdToken will automatically handle emulator tokens
    // The FIREBASE_AUTH_EMULATOR_HOST env var tells the SDK to use the emulator
    const decodedToken = await admin.auth().verifyIdToken(idToken, false);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).json({ error: 'Forbidden', message: 'Invalid or expired Firebase ID token.' });
  }
};

export default authMiddleware;
