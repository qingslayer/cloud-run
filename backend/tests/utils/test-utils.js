/**
 * Test utility functions for making authenticated requests,
 * validating responses, and handling errors consistently.
 */

import fetch from 'node-fetch';
import { getIDToken } from './id-token.test.js';

/**
 * Makes an authenticated HTTP request with automatic token handling
 * @param {string} url - The full URL to request
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {boolean} options.silent - If true, suppresses token acquisition logs
 * @returns {Promise<{response: Response, data: any}>} Response object and parsed JSON data
 */
export async function makeAuthenticatedRequest(url, options = {}) {
  const { silent = false, ...fetchOptions } = options;
  
  // Get authentication token
  const idToken = await getIDToken();
  
  // Ensure headers object exists
  const headers = {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  
  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });
  
  // Parse JSON response (will throw if not JSON)
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Failed to parse response as JSON: ${error.message}`);
  }
  
  return { response, data };
}

/**
 * Makes an authenticated form data request (for file uploads)
 * @param {string} url - The full URL to request
 * @param {FormData} formData - FormData object with file and fields
 * @param {object} options - Additional fetch options
 * @returns {Promise<{response: Response, data: any}>} Response object and parsed JSON data
 */
export async function makeAuthenticatedFormRequest(url, formData, options = {}) {
  const idToken = await getIDToken();
  
  const headers = {
    'Authorization': `Bearer ${idToken}`,
    ...formData.getHeaders(),
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    method: options.method || 'POST',
    headers,
    body: formData,
  });
  
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Failed to parse response as JSON: ${error.message}`);
  }
  
  return { response, data };
}

/**
 * Validates a response with optional custom validation
 * @param {Response} response - Fetch response object
 * @param {number|number[]} expectedStatus - Expected status code(s)
 * @param {function} validator - Optional function to validate response data
 * @returns {object} Validation result with {valid: boolean, errors: string[]}
 */
export function validateResponse(response, expectedStatus = 200, validator = null) {
  const errors = [];
  const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  
  // Check status code
  if (!expectedStatuses.includes(response.status)) {
    errors.push(`Expected status ${expectedStatuses.join(' or ')}, got ${response.status}`);
  }
  
  // Run custom validator if provided
  if (validator && typeof validator === 'function') {
    try {
      const validationResult = validator(response);
      if (validationResult !== true && typeof validationResult === 'string') {
        errors.push(validationResult);
      } else if (Array.isArray(validationResult)) {
        errors.push(...validationResult);
      }
    } catch (error) {
      errors.push(`Validator error: ${error.message}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates response data structure
 * @param {any} data - Response data to validate
 * @param {object} schema - Schema object with required fields and types
 * @returns {string|true} Error message or true if valid
 */
export function validateDataStructure(data, schema) {
  if (!data || typeof data !== 'object') {
    return 'Response data is not an object';
  }
  
  const errors = [];
  
  for (const [field, expectedType] of Object.entries(schema)) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    } else {
      const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
      if (actualType !== expectedType) {
        errors.push(`Field '${field}' expected type '${expectedType}', got '${actualType}'`);
      }
    }
  }
  
  return errors.length > 0 ? errors.join('; ') : true;
}

/**
 * Handles test errors with consistent formatting
 * @param {Error} error - The error object
 * @param {string} testName - Name of the test for context
 * @param {object} context - Additional context (response, data, etc.)
 */
export function handleTestError(error, testName, context = {}) {
  console.error(`\n❌ Test Failed: ${testName}`);
  console.error('Error:', error.message);
  
  if (context.response) {
    console.error(`Status: ${context.response.status} ${context.response.statusText}`);
  }
  
  if (context.data) {
    console.error('Response data:', JSON.stringify(context.data, null, 2));
  }
  
  if (error.stack && process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  
  throw error;
}

/**
 * Logs test success with optional details
 * @param {string} message - Success message
 * @param {object} details - Optional details to log
 */
export function logTestSuccess(message, details = null) {
  console.log(`\n✅ ${message}`);
  if (details) {
    console.log('Details:', JSON.stringify(details, null, 2));
  }
}

/**
 * Asserts a condition and throws if false
 * @param {boolean} condition - Condition to assert
 * @param {string} message - Error message if assertion fails
 */
export function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

