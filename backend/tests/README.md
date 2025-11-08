# High-Level Tests

- `connection.test.js` - Verifies GCP service connections (Gemini, Storage, Firestore, Firebase)

# Backend Tests

Feature-specific test scripts for the HealthVault backend API.

## Quick Reference

| Category | Endpoint | Test | Arguments |
|----------|----------|------|-----------|
| Chat | `POST /api/chat` | `chat/chat.test.js` | None |
| Documents | `DELETE /api/documents/:id` | `documents/delete-document.test.js` | `<file_path>` |
| Documents | `GET /api/documents` | `documents/list-documents.test.js` | `[category] [limit] [offset]` |
| Documents | `GET /api/documents/:id` | `documents/get-document.test.js` | `<file_path>` |
| Documents | `POST /api/documents/:id/analyze` | `documents/analyze-document.test.js` | `<file_path>` |
| Documents | `POST /api/documents/upload` | `documents/upload.test.js` | `<file_path>` |
| Documents | `PUT /api/documents/:id` | `documents/edit-document.test.js` | `<file_path>` |
| Search | `POST /api/documents/search` | `search/answer.test.js` | None |
| Search | `POST /api/documents/search` | `search/chat.test.js` | None |
| Search | `POST /api/documents/search` | `search/semantic.test.js` | None |
| Search | `POST /api/documents/search` | `search/simple.test.js` | None |
| Utilities | Auth Emulator | `utils/id-token.test.js` | None |

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
node tests/<category>/<test-name>.test.js [arguments]
```

## Test Categories

### 🔧 Utilities

#### `utils/id-token.test.js`

Gets a Firebase ID token from the Auth Emulator for testing authenticated endpoints.

```bash
node tests/utils/id-token.test.js
```

**Output**: Prints a valid Firebase ID token that can be used with curl or other tools.

---

#### `utils/test-utils.js`

Shared utility functions for making authenticated requests, validating responses, and handling errors consistently.

**Available Functions**:
- `makeAuthenticatedRequest(url, options)` - Makes an authenticated HTTP request with automatic token handling
- `makeAuthenticatedFormRequest(url, formData, options)` - Makes an authenticated form data request (for file uploads)
- `validateResponse(response, expectedStatus, validator)` - Validates response status and optional custom validation
- `validateDataStructure(data, schema)` - Validates response data structure against a schema
- `handleTestError(error, testName, context)` - Handles test errors with consistent formatting
- `logTestSuccess(message, details)` - Logs test success with optional details
- `assert(condition, message)` - Asserts a condition and throws if false

---

### 📄 Document Management Tests

#### `documents/upload.test.js`

Tests the document upload endpoint with automatic authentication.

```bash
node tests/documents/upload.test.js <path_to_file>
```

**Example**:
```bash
node tests/documents/upload.test.js ~/Downloads/sample.pdf
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to the `/api/documents/upload` endpoint
- Displays the response

---

#### `documents/list-documents.test.js`

Tests the document listing endpoint with optional filtering and pagination.

```bash
node tests/documents/list-documents.test.js [category] [limit] [offset]
```

**Examples**:
```bash
# List all documents
node tests/documents/list-documents.test.js

# Filter by category
node tests/documents/list-documents.test.js test_category

# Limit to 5 results
node tests/documents/list-documents.test.js "" 5

# Get 5 results starting from offset 5
node tests/documents/list-documents.test.js "" 5 5
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Fetches documents from the `/api/documents` endpoint
- Supports optional query parameters for filtering and pagination
- Displays the list of documents

---

#### `documents/get-document.test.js`

Tests fetching a single document by ID, including download URL generation.

```bash
node tests/documents/get-document.test.js <path_to_file>
```

**Example**:
```bash
node tests/documents/get-document.test.js ~/Downloads/sample.png
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to create a new document
- Immediately fetches the document by `documentId` from the `/api/documents/:id` endpoint
- Verifies that the endpoint works and a `downloadUrl` is generated

---

#### `documents/edit-document.test.js`

Tests the document editing endpoint with metadata updates and immutable field protection.

```bash
node tests/documents/edit-document.test.js <path_to_file>
```

**Example**:
```bash
node tests/documents/edit-document.test.js ~/Downloads/sample.png
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to create a new document
- Edits the document metadata (name, category, notes) via the `/api/documents/:id` endpoint
- Fetches the document to verify that the changes were applied correctly
- Tests immutable field protection (userId, storagePath, createdAt)

---

#### `documents/delete-document.test.js`

Tests the document deletion endpoint with full verification.

```bash
node tests/documents/delete-document.test.js <path_to_file>
```

**Example**:
```bash
node tests/documents/delete-document.test.js ~/Downloads/sample.png
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to get a `documentId` and `storagePath`
- Deletes the document via the `/api/documents/:id` endpoint
- Verifies the document is removed from Firestore (API returns 404)
- Verifies the file is removed from Cloud Storage using the `storagePath`

---

#### `documents/analyze-document.test.js`

Tests the AI document analysis endpoint with full metadata verification.

```bash
node tests/documents/analyze-document.test.js <path_to_file>
```

**Example**:
```bash
node tests/documents/analyze-document.test.js ~/Downloads/sample-lab-report.pdf
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Uploads the specified file to create a new document
- Triggers AI analysis via the `/api/documents/:id/analyze` endpoint
- Verifies that AI-generated data is correctly added to the document's metadata in Firestore
- Checks for `displayName`, `category`, `extractedText`, `aiAnalysis`, and `analyzedAt` fields

---

### 💬 Chat Tests

#### `chat/chat.test.js`

Tests the conversational chat endpoint with session management and follow-up messages.

```bash
node tests/chat/chat.test.js
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Sends an initial message to the `/api/chat` endpoint
- Verifies that a `sessionId` is returned
- Sends a follow-up message with the same `sessionId` and `conversationHistory`
- Verifies that the follow-up response maintains the same `sessionId`
- Tests multi-turn conversation capabilities

---

### 🔍 Search Tests

The following tests verify different response types from the `/api/documents/search` endpoint. The endpoint intelligently routes queries to different handlers based on the query intent.

#### `search/simple.test.js`

Tests the search endpoint expecting a "documents" response type (simple document listing without AI).

```bash
node tests/search/simple.test.js
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Sends a query to the `/api/documents/search` endpoint
- Verifies that the response type is `"documents"` (simple document listing)
- Tests queries that don't require AI processing

---

#### `search/semantic.test.js`

Tests the search endpoint expecting a "summary" response type (semantic search with AI-generated summary).

```bash
node tests/search/semantic.test.js
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Sends a query to the `/api/documents/search` endpoint
- Verifies that the response type is `"summary"` (semantic search results with AI summary)
- Tests semantic search capabilities

---

#### `search/answer.test.js`

Tests the search endpoint expecting an "answer" response type (direct answer from documents).

```bash
node tests/search/answer.test.js
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Sends a query to the `/api/documents/search` endpoint
- Verifies that the response type is `"answer"` (direct answer extracted from documents)
- Tests question-answering capabilities

---

#### `search/chat.test.js`

Tests the search endpoint expecting a "chat" response type (conversational response with session).

```bash
node tests/search/chat.test.js
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Sends a query to the `/api/documents/search` endpoint
- Verifies that the response type is `"chat"` (conversational response requiring follow-up)
- Verifies that a `sessionId` is included for multi-turn conversations
- Tests conversational search capabilities

---

## Troubleshooting

### Common Issues

**Problem**: `Error getting ID Token from Emulator`
- **Solution**: Ensure Firebase emulators are running (`firebase emulators:start`)
- **Solution**: Verify test user exists in Auth Emulator UI (http://localhost:9000)

**Problem**: `ECONNREFUSED` or connection errors
- **Solution**: Ensure backend server is running (`npm run dev` in `backend/` directory)
- **Solution**: Verify backend is running on `http://localhost:8080`

**Problem**: `File not found` errors
- **Solution**: Use absolute paths or paths relative to the `backend/` directory
- **Solution**: Verify file exists before running the test

**Problem**: Tests fail with authentication errors
- **Solution**: Run `test-id-token.js` first to verify auth setup
- **Solution**: Check that `.env` file has correct `PROJECT_ID`

---

## Adding New Tests

When adding new feature tests:

1. Create a new `<feature>.test.js` file in the appropriate category folder (`documents/`, `search/`, `chat/`, etc.)
2. Use the shared utilities from `utils/test-utils.js` for authenticated requests, validation, and error handling
3. Use constants from `utils/config.test.js` for API URLs

---