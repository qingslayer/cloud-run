# Backend Tests

Feature-specific test scripts for the HealthVault backend API.

## Prerequisites

1. **Environment Setup**: Ensure `.env` file is configured in the `backend/` directory
2. **Firebase Emulators**: Must be running (`firebase emulators:start`)
3. **Backend Server**: Must be running (`npm run dev`)
4. **Test User**: Create a test user in the Auth Emulator:
   - Email: `test@example.com`
   - Password: `password123`

## Running Tests

All test commands should be run from the `backend/` directory:

```bash
cd backend
node tests/<test-name>.js [arguments]
```

## Available Tests

### `test-id-token.js`

Gets a Firebase ID token from the Auth Emulator for testing authenticated endpoints.

```bash
node tests/test-id-token.js
```

**Output**: Prints a valid Firebase ID token that can be used with curl or other tools.

---

### `test-upload.js`

Tests the document upload endpoint with automatic authentication.

```bash
node tests/test-upload.js <path_to_file>
```

**Example**:
```bash
node tests/test-upload.js ~/Downloads/sample.pdf
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to the `/api/documents/upload` endpoint
- Displays the response

---

### `test-list-documents.js`

Tests the document listing endpoint with optional filtering and pagination.

```bash
node tests/test-list-documents.js [category] [limit] [offset]
```

**Examples**:
```bash
# List all documents
node tests/test-list-documents.js

# Filter by category
node tests/test-list-documents.js test_category

# Limit to 5 results
node tests/test-list-documents.js "" 5

# Get 5 results starting from offset 5
node tests/test-list-documents.js "" 5 5
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Fetches documents from the `/api/documents` endpoint
- Supports optional query parameters for filtering and pagination
- Displays the list of documents

---

### `test-get-document.js`

Tests fetching a single document by ID, including download URL generation.

```bash
node tests/test-get-document.js <path_to_file>
```

**Example**:
```bash
node tests/test-get-document.js ~/Downloads/sample.png
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to create a new document
- Immediately fetches the document by `documentId` from the `/api/documents/:id` endpoint
- Verifies that the endpoint works and a `downloadUrl` is generated

---

### `test-delete-document.js`

Tests the document deletion endpoint with full verification.

```bash
node tests/test-delete-document.js <path_to_file>
```

**Example**:
```bash
node tests/test-delete-document.js ~/Downloads/sample.png
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to get a `documentId` and `storagePath`
- Deletes the document via the `/api/documents/:id` endpoint
- Verifies the document is removed from Firestore (API returns 404)
- Verifies the file is removed from Cloud Storage using the `storagePath`

---

### `test-edit-document.js`

Tests the document editing endpoint with metadata updates and immutable field protection.

```bash
node tests/test-edit-document.js <path_to_file>
```

**Example**:
```bash
node tests/test-edit-document.js ~/Downloads/sample.png
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to create a new document
- Edits the document metadata (name, category, notes) via the `/api/documents/:id` endpoint
- Fetches the document to verify that the changes were applied correctly
- Tests immutable field protection (userId, storagePath, createdAt)

---

## Adding New Tests

When adding new feature tests:

1. Create a new `test-<feature>.js` file in this directory
2. Follow the pattern of existing tests (auto-token generation, clear output)
3. Update this README with usage instructions
4. Use the naming convention: `test-<feature-name>.js`

## High-Level Tests

High-level infrastructure tests (not feature-specific) are kept in the `backend/` root:
- `test-connection.js` - Verifies GCP service connections (Gemini, Storage, Firestore, Firebase)

