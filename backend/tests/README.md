# Backend Tests

Feature-specific test scripts for the HealthVault backend API.

## Prerequisites

1. **Environment Setup**: Ensure `.env` file is configured in the `backend/` directory
2. **Firebase Emulators**: Must be running (`firebase emulators:start`)
3. **Backend Server**: Must be running (`npm run dev`)
4. **Test User**: Create a test user in the Auth Emulator:
   - Email: `test@example.com`
   - Password: `password123`

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

## Adding New Tests

When adding new feature tests:

1. Create a new `test-<feature>.js` file in this directory
2. Follow the pattern of existing tests (auto-token generation, clear output)
3. Update this README with usage instructions
4. Use the naming convention: `test-<feature-name>.js`

## High-Level Tests

High-level infrastructure tests (not feature-specific) are kept in the `backend/` root:
- `test-connection.js` - Verifies GCP service connections (Gemini, Storage, Firestore, Firebase)

