import express from 'express';
import { FieldValue } from '@google-cloud/firestore';
import { firestore } from '../config/firestore.js';
import { sendBadRequest, sendForbidden, sendNotFound, sendServerError } from '../utils/responses.js';
import { ERROR_MESSAGES } from '../config/constants.js';

const router = express.Router();

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
    return sendServerError(res, error, 'Failed to initialize user profile');
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
      return sendForbidden(res, ERROR_MESSAGES.USER_ACCESS_DENIED);
    }

    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
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
    return sendServerError(res, error, ERROR_MESSAGES.USER_FETCH_FAILED);
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
      return sendForbidden(res, ERROR_MESSAGES.USER_ACCESS_DENIED);
    }

    const { displayName, photoURL } = req.body;

    // Validate that at least one field is provided
    if (!displayName && photoURL === undefined) {
      return sendBadRequest(res, 'At least one field (displayName or photoURL) must be provided');
    }

    // Build update object
    const updates = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return sendBadRequest(res, 'displayName must be a non-empty string');
      }
      updates.displayName = displayName.trim();
    }

    if (photoURL !== undefined) {
      if (photoURL !== null && typeof photoURL !== 'string') {
        return sendBadRequest(res, 'photoURL must be a string or null');
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
    return sendServerError(res, error, ERROR_MESSAGES.USER_UPDATE_FAILED);
  }
});

export default router;
