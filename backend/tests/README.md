# Backend Tests

Feature-specific test scripts for the HealthVault backend API.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Getting Started](#getting-started)
- [Document Management Tests](#document-management-tests)
- [Chat Tests](#chat-tests)
- [Search Tests](#search-tests)
- [Troubleshooting](#troubleshooting)
- [Adding New Tests](#adding-new-tests)

---

## Quick Reference

> **Note:** All tests should be run from the `backend/` directory:
> ```bash
> cd backend
> node tests/<category>/<test-name>.test.js [arguments]
> ```

| Category | Test | Description |
|----------|------|-------------|
| Chat | `chat/chat.test.js` | Basic conversation |
| Chat | `chat/chat-caching.test.js` | Session caching |
| Documents | `documents/analyze-document.test.js` | AI analysis |
| Documents | `documents/delete-document.test.js` | Delete document |
| Documents | `documents/edit-document.test.js` | Edit metadata |
| Documents | `documents/get-document.test.js` | Get single document |
| Documents | `documents/list-documents.test.js` | List with filters |
| Documents | `documents/upload.test.js` | Upload file |
| Search | `search/answer.test.js` | Answer query |
| Search | `search/chat.test.js` | Chat query |
| Search | `search/semantic.test.js` | Semantic search |
| Search | `search/simple.test.js` | Simple listing |

---

## Getting Started

### Prerequisites

Before running tests, ensure:

1. **Backend setup complete**: Follow the [main README](../../README.md#backend-setup) to configure `.env` and verify connections
2. **Firebase Emulators running**: `firebase emulators:start`
3. **Backend Server running**: `npm run dev` (in `backend/` directory)
4. **Test User created**: In the Auth Emulator UI (http://localhost:9000):
   - Email: `test@example.com`
   - Password: `password123`

### Test Utilities

The `tests/utils/` folder contains shared utilities used by all tests:

**Runnable Utilities:**
- `utils/id-token.test.js` - Gets a Firebase ID token from the Auth Emulator (can run standalone or import)

**Helper Modules (Import Only):**
- `utils/test-config.js` - Configuration constants (API URLs, test credentials, emulator settings)
- `utils/test-utils.js` - Shared functions for authenticated requests, validation, and error handling

---

## Document Management Tests

### `documents/upload.test.js`

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

### `documents/list-documents.test.js`

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

### `documents/get-document.test.js`

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

### `documents/edit-document.test.js`

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

### `documents/delete-document.test.js`

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

### `documents/analyze-document.test.js`

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

## Chat Tests

### `chat/chat.test.js`

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

### `chat/chat-caching.test.js`

Tests the session caching implementation for improved performance and reduced costs.

```bash
node tests/chat/chat-caching.test.js
```

**What it does**:
- Automatically obtains a fresh token from the Auth Emulator
- Sends a search query that triggers chat mode to the `/api/documents/search` endpoint
- Verifies that a `sessionId` is returned in the response
- Sends a follow-up message with the same `sessionId` to the `/api/chat` endpoint
- Verifies that the follow-up response maintains the same `sessionId`
- Tests that session caching works for multi-turn conversations

---

## Search Tests

The following tests verify different response types from the `/api/documents/search` endpoint. The endpoint intelligently routes queries to different handlers based on the query intent.

### `search/simple.test.js`

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

### `search/semantic.test.js`

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

### `search/answer.test.js`

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

### `search/chat.test.js`

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
- **Solution**: Run `utils/id-token.test.js` first to verify auth setup
- **Solution**: Check that `.env` file has correct `GOOGLE_CLOUD_PROJECT`

---

## Adding New Tests

When adding new feature tests:

1. Create a new `<feature>.test.js` file in the appropriate category folder (`documents/`, `search/`, `chat/`, etc.)
2. Use the shared utilities from `utils/test-utils.js` for authenticated requests, validation, and error handling
3. Use constants from `utils/test-config.js` for API URLs and test configuration

---