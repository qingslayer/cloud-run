# Shared Resources Library

> **Living Document**: This document catalogs all shared utilities, constants, services, and components that already exist in the codebase. **Check here first** before building new features to avoid duplicating existing work.

Last Updated: 2024-11-19

---

## Table of Contents

- [Backend Shared Resources](#backend-shared-resources)
  - [Configuration & Constants](#configuration--constants)
  - [Cloud Clients (Singletons)](#cloud-clients-singletons)
  - [Utilities](#utilities)
  - [Services](#services)
  - [Middleware](#middleware)
- [Frontend Shared Resources](#frontend-shared-resources)
  - [Services](#frontend-services)
  - [Components](#components)
  - [Hooks](#hooks)
  - [Utilities](#frontend-utilities)

---

## Backend Shared Resources

### Configuration & Constants

#### `backend/src/config/constants.js`
Centralized configuration values, limits, and error messages. **Always use these instead of hardcoded values.**

**File Limits:**
```javascript
FILE_LIMITS.MAX_FILE_SIZE          // 10MB file upload limit
```

**Cache Configuration:**
```javascript
CACHE_CONFIG.SESSION_TTL           // 10 minutes session cache TTL
CACHE_CONFIG.SESSION_CLEANUP_INTERVAL  // 1 minute cleanup interval
CACHE_CONFIG.SEARCH_TTL            // 5 minutes search cache TTL
CACHE_CONFIG.SEARCH_MAX_SIZE       // 100 items max cache size
```

**Query Limits:**
```javascript
QUERY_LIMITS.DEFAULT_LIST          // 50 - default pagination limit
QUERY_LIMITS.DOCUMENTS_SEARCH      // 50 - max documents in search
QUERY_LIMITS.FUZZY_RESULTS         // 20 - max fuzzy search results
QUERY_LIMITS.AI_SUMMARY            // 15 - max docs for AI summary
QUERY_LIMITS.AI_ANSWER             // 10 - max docs for AI answer
QUERY_LIMITS.TOP_RANKED            // 50 - default top ranked docs
```

**Time Durations:**
```javascript
TIME_DURATIONS.SIGNED_URL_EXPIRY   // 1 hour for signed URLs
TIME_DURATIONS.RECENT_DAYS_THRESHOLD   // 30 days
TIME_DURATIONS.MEDIUM_AGE_THRESHOLD    // 90 days
TIME_DURATIONS.OLD_AGE_THRESHOLD       // 365 days
```

**Document Categories:**
```javascript
DOCUMENT_CATEGORIES  // Array: ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other']
```

**HTTP Status Codes:**
```javascript
HTTP_STATUS.OK                     // 200
HTTP_STATUS.CREATED                // 201
HTTP_STATUS.BAD_REQUEST            // 400
HTTP_STATUS.UNAUTHORIZED           // 401
HTTP_STATUS.FORBIDDEN              // 403
HTTP_STATUS.NOT_FOUND              // 404
HTTP_STATUS.INTERNAL_SERVER_ERROR  // 500
```

**Error Messages:**
```javascript
ERROR_MESSAGES.DOCUMENT_NOT_FOUND
ERROR_MESSAGES.DOCUMENT_ACCESS_DENIED
ERROR_MESSAGES.DOCUMENT_UPLOAD_FAILED
ERROR_MESSAGES.NO_FILE_PROVIDED
ERROR_MESSAGES.SEARCH_FAILED
ERROR_MESSAGES.CHAT_SEND_FAILED
ERROR_MESSAGES.SESSION_NOT_FOUND
ERROR_MESSAGES.USER_NOT_FOUND
// ... and many more - see file for complete list
```

**Search Ranking Configuration:**
```javascript
SEARCH_RANKING.FIELD_WEIGHTS       // Weights for different fields
SEARCH_RANKING.RECENCY_BOOST       // Recency boost multipliers
SEARCH_RANKING.STATUS_BOOST        // Status boost multipliers
```

**Fuzzy Search Configuration:**
```javascript
FUZZY_SEARCH_CONFIG.THRESHOLD
FUZZY_SEARCH_CONFIG.MIN_MATCH_CHAR_LENGTH
FUZZY_SEARCH_CONFIG.KEYS          // Field weights for Fuse.js
```

**AI Text Processing Limits:**
```javascript
AI_TEXT_LIMITS.CATEGORIZATION      // 10000 chars
AI_TEXT_LIMITS.SEARCH_SUMMARY      // 8000 chars
```

---

### Cloud Clients (Singletons)

#### `backend/src/config/firestore.js`
**Singleton Firestore instance** - Use this everywhere instead of creating new instances.
```javascript
import { firestore } from '../config/firestore.js';
// firestore is ready to use - already initialized
```

#### `backend/src/config/storage.js`
**Singleton Cloud Storage instance** - Use this everywhere instead of creating new instances.
```javascript
import { storage } from '../config/storage.js';
// storage is ready to use - already initialized
```

#### `backend/src/config/firebase.js`
Firebase Admin SDK initialization with comprehensive environment detection and error handling.
```javascript
import admin from '../config/firebase.js';
// admin is the initialized Firebase Admin SDK instance
```

---

### Utilities

#### `backend/src/utils/responses.js`
**Standardized response helpers** - Use these for all API responses to ensure consistency.

**Functions:**
```javascript
sendError(res, status, error, message?)          // Generic error response
sendSuccess(res, data, status=200)               // Success response
sendNotFound(res, message='Resource not found')  // 404 response
sendForbidden(res, message='Access denied')      // 403 response
sendBadRequest(res, message)                     // 400 response
sendServerError(res, error, publicMessage)       // 500 response (handles dev/prod)
sendUnauthorized(res, message='Unauthorized')    // 401 response
```

**Example:**
```javascript
import { sendNotFound, sendForbidden, sendServerError } from '../utils/responses.js';

// Instead of:
return res.status(404).json({ error: 'Document not found' });

// Use:
return sendNotFound(res, ERROR_MESSAGES.DOCUMENT_NOT_FOUND);
```

#### `backend/src/utils/documentAuth.js`
**Document ownership and access control utilities** - Use these to verify document access.

**Functions:**
```javascript
getDocument(documentId)                          // Fetch document, throw if not found
verifyOwnership(documentData, userId)            // Verify user owns document
getOwnedDocument(documentId, userId)             // Combined: fetch + verify ownership
```

**Example:**
```javascript
import { getOwnedDocument } from '../utils/documentAuth.js';

// Instead of manually fetching and checking:
const docRef = firestore.collection('documents').doc(id);
const doc = await docRef.get();
if (!doc.exists) { return res.status(404)... }
if (doc.data().userId !== uid) { return res.status(403)... }

// Use:
const { docRef, documentData } = await getOwnedDocument(id, uid);
// Automatically throws with appropriate status code if not found or access denied
```

---

### Services

#### AI Services (`backend/src/services/gemini/`)

**Document Analyzer:**
`backend/src/services/gemini/documentAnalyzer.js`
```javascript
import { analyzeDocument } from '../services/gemini/documentAnalyzer.js';

// Runs complete analysis pipeline: text extraction → categorization → structured data → summary
const result = await analyzeDocument(base64Data, mimeType);
// Returns: { displayName, category, aiAnalysis: { category, structuredData, searchSummary } }
```

**Chat Service:**
`backend/src/services/gemini/chatService.js`
```javascript
import { getAIChatResponse } from '../services/gemini/chatService.js';

const result = await getAIChatResponse(query, documents, history);
// Returns: { answer, referencedDocuments, suggestedFollowUps }
```

**Search Service:**
`backend/src/services/gemini/searchService.js`
```javascript
import { getAIAnswer, getAISummary } from '../services/gemini/searchService.js';

// For Q&A queries:
const answer = await getAIAnswer(query, documents);

// For semantic search summaries:
const summary = await getAISummary(query, documents);
```

**Document Processor:**
`backend/src/services/gemini/documentProcessor.js`
```javascript
import {
  extractTextFromDocument,
  analyzeAndCategorizeDocument,
  extractStructuredData,
  generateSearchSummary
} from '../services/gemini/documentProcessor.js';

// Individual processing steps (or use analyzeDocument for the full pipeline)
```

#### AI Utilities (`backend/src/services/gemini/utils/`)

**AI Context Builder:**
`backend/src/services/gemini/utils/aiContext.js`
```javascript
import { buildDocumentContext } from '../services/gemini/utils/aiContext.js';

// Builds formatted context string for AI prompts from documents
const contextString = buildDocumentContext(documents);
```

**Document Matcher:**
`backend/src/services/gemini/utils/documentMatcher.js`
```javascript
import { matchDocumentReferences } from '../services/gemini/utils/documentMatcher.js';

// Matches AI-returned document references to actual document objects
const matchedDocs = matchDocumentReferences(aiReferences, documents);
```

#### Other Services

**Query Analyzer:**
`backend/src/services/queryAnalyzer.js`
```javascript
import { analyzeQuery, generateSimilaritySuggestions } from '../services/queryAnalyzer.js';

const analysis = analyzeQuery(query);
// Returns: { queryType, filters, keywords, needsAI }
```

**Search Ranking:**
`backend/src/services/searchRanking.js`
```javascript
import { rankDocuments } from '../services/searchRanking.js';

const rankedDocs = rankDocuments(documents, query, options);
```

**Session Cache:**
`backend/src/services/sessionCache.js`
```javascript
import sessionCache from '../services/sessionCache.js';

sessionCache.set(sessionId, data);
const data = sessionCache.get(sessionId);
sessionCache.delete(sessionId);
```

**Search Cache:**
`backend/src/services/searchCache.js`
```javascript
import { getCachedResults, setCachedResults, invalidateUserCache } from '../services/searchCache.js';
```

---

### Middleware

#### `backend/src/middleware/auth.js`
Firebase authentication middleware that verifies ID tokens and attaches user info to `req.user`.

**Usage:**
```javascript
import authMiddleware from './middleware/auth.js';

router.use(authMiddleware);  // Protects all routes
// req.user will contain: { uid, email, displayName, photoURL }
```

---

## Frontend Shared Resources

### Frontend Services

#### `frontend/src/services/documentProcessor.ts`
Client-side document processing and API calls for document operations.

#### `frontend/src/services/chatService.ts`
Client-side chat API integration.

#### `frontend/src/services/searchService.ts`
Client-side search API integration.

#### `frontend/src/services/userService.ts`
User profile management API calls.

---

### Components

**Reusable UI Components:**
- `LoadingSpinner.tsx` - Loading indicator
- `LoadingState.tsx` - Full-screen loading state
- `Toast.tsx` / `ToastContainer.tsx` - Toast notifications
- `ConfirmationModal.tsx` - Confirmation dialogs
- `DocumentCard.tsx` - Document display card
- `Breadcrumbs.tsx` - Navigation breadcrumbs
- `GlobalUploadButton.tsx` - Floating upload button

**Editable Components:**
- `EditableStructuredData.tsx` - Generic structured data editor
- `EditableLabResults.tsx` - Lab results editor
- `EditablePrescriptions.tsx` - Prescriptions editor

**Icons:**
All icons are in `frontend/src/components/icons/` and can be imported individually.

---

### Hooks

#### `frontend/src/hooks/useToast.ts`
Toast notification hook for displaying user feedback.

```typescript
const toast = useToast();
toast.success('Document uploaded successfully');
toast.error('Failed to upload document');
toast.info('Processing document...');
```

#### `frontend/src/hooks/useOnboarding.ts`
Onboarding/tutorial flow management.

---

### Frontend Utilities

#### `frontend/src/utils/formatters.ts`
Formatting utilities for dates, file sizes, etc.

#### `frontend/src/utils/health-helpers.ts`
Health data parsing and formatting helpers.

---

## Usage Guidelines

### Before Building a New Feature:

1. **Check this document first** - Don't reinvent the wheel
2. **Use existing constants** - Never hardcode values that exist in `constants.js`
3. **Use singleton clients** - Always import from `config/firestore.js` and `config/storage.js`
4. **Use response utilities** - Standardize all API responses with `utils/responses.js`
5. **Use existing services** - Leverage AI services, caching, ranking, etc.

### When Adding New Shared Resources:

1. **Update this document immediately** - Keep the library current
2. **Add clear documentation** - Include usage examples
3. **Follow existing patterns** - Maintain consistency with current utilities
4. **Export from appropriate locations** - Use proper module structure

---

## Maintenance

This document should be updated whenever:
- New utilities are added
- New constants are defined
- New services are created
- Existing functionality is refactored
- APIs or interfaces change

**Last updated by:** Claude Code
**Date:** 2024-11-19
**Changes:** Initial creation of shared resources library after backend refactoring
