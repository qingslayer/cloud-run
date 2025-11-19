/**
 * Standardized response utility functions
 * This module provides consistent response formatting across all routes
 */

import { HTTP_STATUS } from '../config/constants.js';

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} error - Error message
 * @param {string} [message] - Optional detailed error message
 */
export const sendError = (res, status, error, message = null) => {
  const response = { error };
  if (message) {
    response.message = message;
  }
  return res.status(status).json(response);
};

/**
 * Send a standardized success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} [status=200] - HTTP status code
 */
export const sendSuccess = (res, data, status = HTTP_STATUS.OK) => {
  return res.status(status).json(data);
};

/**
 * Send a 404 Not Found response
 * @param {Object} res - Express response object
 * @param {string} [message='Resource not found'] - Custom error message
 */
export const sendNotFound = (res, message = 'Resource not found') => {
  return res.status(HTTP_STATUS.NOT_FOUND).json({ error: message });
};

/**
 * Send a 403 Forbidden response
 * @param {Object} res - Express response object
 * @param {string} [message='Access denied'] - Custom error message
 */
export const sendForbidden = (res, message = 'Access denied') => {
  return res.status(HTTP_STATUS.FORBIDDEN).json({ error: message });
};

/**
 * Send a 400 Bad Request response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const sendBadRequest = (res, message) => {
  return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: message });
};

/**
 * Send a 500 Internal Server Error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} publicMessage - User-facing error message
 */
export const sendServerError = (res, error, publicMessage) => {
  console.error(`Server Error: ${publicMessage}`, error);

  // In development, include detailed error info
  if (process.env.NODE_ENV !== 'production') {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: publicMessage,
      message: error.message,
      stack: error.stack,
    });
  }

  // In production, send minimal error info
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: publicMessage,
    message: error.message,
  });
};

/**
 * Send a 401 Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} [message='Unauthorized'] - Custom error message
 */
export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: message });
};
