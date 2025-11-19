/**
 * Document Authorization Utilities
 * Centralized functions for document ownership verification and access control
 */

import { firestore } from '../config/firestore.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Fetch a document from Firestore by ID
 * @param {string} documentId - The document ID
 * @returns {Promise<{docRef, documentData}>} Document reference and data
 * @throws {Error} If document doesn't exist
 */
export async function getDocument(documentId) {
  const docRef = firestore.collection('documents').doc(documentId);
  const doc = await docRef.get();

  if (!doc.exists) {
    const error = new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);
    error.status = 404;
    throw error;
  }

  return {
    docRef,
    documentData: doc.data()
  };
}

/**
 * Verify that a user owns a document
 * @param {Object} documentData - The document data
 * @param {string} userId - The user ID to verify
 * @throws {Error} If user doesn't own the document
 */
export function verifyOwnership(documentData, userId) {
  if (documentData.userId !== userId) {
    const error = new Error(ERROR_MESSAGES.DOCUMENT_ACCESS_DENIED);
    error.status = 403;
    throw error;
  }
}

/**
 * Get a document and verify ownership in one step
 * @param {string} documentId - The document ID
 * @param {string} userId - The user ID to verify
 * @returns {Promise<{docRef, documentData}>} Document reference and data
 * @throws {Error} If document doesn't exist or user doesn't own it
 */
export async function getOwnedDocument(documentId, userId) {
  const { docRef, documentData } = await getDocument(documentId);
  verifyOwnership(documentData, userId);
  return { docRef, documentData };
}
