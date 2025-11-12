import express from 'express';
import { Firestore, FieldValue } from '@google-cloud/firestore';

const router = express.Router();

// Initialize Firestore with explicit projectId to use Application Default Credentials
// This prevents it from trying to load GOOGLE_APPLICATION_CREDENTIALS file path
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'helpful-beach-476908-p3';
const firestore = new Firestore({ projectId });

/**
 * POST /api/users
 * Initialize or update user profile
 * This endpoint is called when a user first logs in or wants to update their profile
 */
router.post('/', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.user; // From Firebase Auth middleware

    const userDoc = {
      uid,
      email,
      displayName: displayName || email?.split('@')[0] || 'User',
      photoURL: photoURL || null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Check if user already exists
    const userRef = firestore.collection('users').doc(uid);
    const existingUser = await userRef.get();

    if (existingUser.exists) {
      // Update existing user
      await userRef.update({
        email: userDoc.email,
        photoURL: userDoc.photoURL,
        updatedAt: userDoc.updatedAt,
      });
    } else {
      // Create new user
      userDoc.createdAt = FieldValue.serverTimestamp();
      await userRef.set(userDoc);
    }

    res.status(200).json({
      message: 'User profile initialized successfully',
      user: {
        uid: userDoc.uid,
        email: userDoc.email,
        displayName: userDoc.displayName,
        photoURL: userDoc.photoURL,
      }
    });
  } catch (error) {
    console.error('Error initializing user profile:', error);
    res.status(500).json({
      error: 'Failed to initialize user profile',
      message: error.message
    });
  }
});

/**
 * GET /api/users/:uid
 * Get user profile by UID
 */
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const requestingUserId = req.user.uid;

    // Only allow users to view their own profile
    if (uid !== requestingUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own profile'
      });
    }

    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found'
      });
    }

    const userData = userDoc.data();

    res.status(200).json({
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: error.message
    });
  }
});

/**
 * PATCH /api/users/:uid
 * Update user profile (displayName and photoURL only)
 */
router.patch('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const requestingUserId = req.user.uid;

    // Only allow users to update their own profile
    if (uid !== requestingUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile'
      });
    }

    const { displayName, photoURL } = req.body;

    // Validate that at least one field is provided
    if (!displayName && photoURL === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one field (displayName or photoURL) must be provided'
      });
    }

    // Build update object
    const updates = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'displayName must be a non-empty string'
        });
      }
      updates.displayName = displayName.trim();
    }

    if (photoURL !== undefined) {
      if (photoURL !== null && typeof photoURL !== 'string') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'photoURL must be a string or null'
        });
      }
      updates.photoURL = photoURL;
    }

    const userRef = firestore.collection('users').doc(uid);
    await userRef.update(updates);

    // Fetch the updated user profile
    const updatedDoc = await userRef.get();
    const userData = updatedDoc.data();

    res.status(200).json({
      message: 'User profile updated successfully',
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Failed to update user profile',
      message: error.message
    });
  }
});

export default router;
