# HealthVault Architecture

Technical documentation for the HealthVault application architecture, implementation details, and design decisions.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Backend Architecture](#backend-architecture)
  - [Project Structure](#backend-project-structure)
  - [API Design](#api-design)
  - [Authentication Flow](#authentication-flow)
  - [AI Integration](#ai-integration)
  - [Data Models](#data-models)
- [Frontend Architecture](#frontend-architecture)
- [Infrastructure](#infrastructure)
- [Design Decisions](#design-decisions)

---

## System Architecture

```
┌─────────────────┐
│  React Frontend │ (TypeScript + Vite)
│  Port: 5173     │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│ Express Backend │ (Node.js)
│  Port: 8080     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌─────┐ ┌────────┐ ┌────────┐
│Firebase│ │GCS  │ │Firestore│ │Gemini │
│  Auth  │ │     │ │        │ │  AI   │
└────────┘ └─────┘ └────────┘ └────────┘
```

**Technology Stack:**
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Express.js
- **Database:** Google Cloud Firestore
- **Storage:** Google Cloud Storage
- **Authentication:** Firebase Authentication
- **AI:** Google Gemini AI (Gemini 1.5 Flash)

---

## Backend Architecture

### Backend Project Structure

```
backend/
├── src/
│   ├── config/                    # Configuration & Initialization
│   │   ├── firebase.js            # Firebase Admin SDK setup
│   │   ├── firestore.js           # Firestore singleton
│   │   ├── storage.js             # Cloud Storage singleton
│   │   └── constants.js           # App-wide constants
│   │
│   ├── middleware/                # Express Middleware
│   │   └── auth.js                # Firebase Auth verification
│   │
│   ├── routes/                    # API Route Handlers
│   │   ├── documents.js           # Document CRUD + search
│   │   ├── chat.js                # Chat conversations
│   │   └── users.js               # User profile management
│   │
│   ├── services/                  # Business Logic Layer
│   │   ├── gemini/                # AI Services
│   │   │   ├── client.js          # Gemini client setup
│   │   │   ├── documentAnalyzer.js   # Document analysis pipeline
│   │   │   ├── documentProcessor.js  # Text extraction & processing
│   │   │   ├── chatService.js     # Chat conversations
│   │   │   ├── searchService.js   # Search & Q&A
│   │   │   ├── medicalSynonyms.js # Medical terminology
│   │   │   └── utils/             # AI Utilities
│   │   │       ├── aiContext.js   # Context building
│   │   │       └── documentMatcher.js  # Reference matching
│   │   │
│   │   ├── queryAnalyzer.js       # Query intent analysis
│   │   ├── searchRanking.js       # Search result ranking
│   │   ├── searchCache.js         # Search result caching
│   │   └── sessionCache.js        # Chat session caching
│   │
│   ├── utils/                     # Shared Utilities
│   │   ├── responses.js           # Standardized API responses
│   │   └── documentAuth.js        # Document authorization
│   │
│   └── server.js                  # Express app entry point
│
├── tests/                         # API Integration Tests
│   ├── documents/                 # Document endpoint tests
│   ├── chat/                      # Chat endpoint tests
│   ├── search/                    # Search endpoint tests
│   └── utils/                     # Test utilities
│
└── migrations/                    # Database migration scripts
```

### API Design

**Base URL:** `http://localhost:8080/api` (development)

**Authentication:** All `/api/*` routes require Firebase ID token in `Authorization: Bearer <token>` header.

#### Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents` | List user's documents (supports filtering & pagination) |
| `GET` | `/api/documents/:id` | Get single document with download URL |
| `POST` | `/api/documents/upload` | Upload new document |
| `PATCH` | `/api/documents/:id` | Update document metadata |
| `DELETE` | `/api/documents/:id` | Delete document from storage & database |
| `POST` | `/api/documents/:id/analyze` | Trigger AI analysis of document |
| `POST` | `/api/documents/search` | Intelligent search (routes to AI based on query) |

#### Chat & Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send chat message (with optional sessionId) |
| `POST` | `/api/chat/end-session` | End chat session (clear cache) |

#### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users` | Initialize/update user profile |
| `GET` | `/api/users/:uid` | Get user profile |
| `PATCH` | `/api/users/:uid` | Update user profile |

### Authentication Flow

```
1. User signs in → Firebase Auth (frontend)
2. Firebase returns ID token
3. Frontend includes token in Authorization header
4. Backend auth middleware (middleware/auth.js):
   - Verifies token with Firebase Admin SDK
   - Extracts user info (uid, email, displayName, photoURL)
   - Attaches to req.user
   - Next() or returns 401
5. Route handlers access req.user.uid for authorization
```

### AI Integration

#### Document Analysis Pipeline

When a document is uploaded or re-analyzed:

```javascript
analyzeDocument(base64Data, mimeType)
  ↓
1. extractTextFromDocument()      // Extract text from PDF/image
  ↓
2. analyzeAndCategorizeDocument() // Categorize + generate title
  ↓
3. extractStructuredData()        // Extract medical data (labs, meds, etc.)
  ↓
4. generateSearchSummary()        // Generate concise search summary
  ↓
Returns: { displayName, category, aiAnalysis: {...} }
```

#### Search Query Routing

The `/api/documents/search` endpoint intelligently routes queries:

```javascript
analyzeQuery(query)
  ↓
Determines: queryType (simple, semantic, answer, chat)
  ↓
┌─────────────────┴─────────────────┐
│                                   │
▼                                   ▼
Simple Query                    AI-Powered Query
(e.g., "show prescriptions")    (e.g., "blood pressure trends")
│                                   │
├─ Direct Firestore query           ├─ Fetch relevant documents
├─ No AI processing                 ├─ Build context
├─ Returns: documents list          ├─ Route to appropriate AI service:
                                    │  - Answer (Q&A)
                                    │  - Summary (semantic search)
                                    │  - Chat (conversational)
                                    └─ Returns: AI response + citations
```

#### Chat Session Management

```javascript
Chat Request
  ↓
Check sessionCache for existing session
  ↓
┌─────────────┴────────────┐
│                          │
▼                          ▼
Cache HIT                 Cache MISS
│                          │
Use cached:               Fetch from Firestore:
- documents               - User's documents
- conversationHistory     - Build new session
│                          │
└─────────────┬────────────┘
              ▼
      getAIChatResponse(query, documents, history)
              ↓
      Update cache with new history
              ↓
      Return: { answer, referencedDocuments, sessionId }
```

**Cache Benefits:**
- Reduced Firestore reads (saves costs)
- Faster response times
- Maintained conversation context
- Auto-expiration (10 min TTL)

### Data Models

#### Document Model (Firestore)

```javascript
{
  id: string,                  // Document ID (auto-generated)
  userId: string,              // Owner's Firebase UID
  filename: string,            // Original filename
  displayName: string,         // User-friendly name (AI-generated or user-edited)
  fileType: string,            // MIME type
  size: number,                // File size in bytes
  storagePath: string,         // Cloud Storage path
  category: string,            // One of DOCUMENT_CATEGORIES
  notes: string,               // User notes (optional)
  status: string,              // 'pending' | 'processing' | 'complete' | 'error'
  uploadedAt: Timestamp,       // Upload timestamp
  analyzedAt: Timestamp,       // AI analysis timestamp
  aiAnalysis: {
    category: string,          // AI-determined category
    structuredData: object,    // Extracted medical data (varies by category)
    searchSummary: string,     // Concise summary for search
  },
  searchableText: string,      // Pre-computed searchable text (for fuzzy search)
}
```

**Structured Data Format (varies by category):**

**Lab Results:**
```javascript
{
  testType: string,
  testDate: string,
  results: [{ name, value, unit, referenceRange, status }]
}
```

**Prescriptions:**
```javascript
{
  prescriptionDate: string,
  medications: [{ name, dosage, frequency, duration }]
}
```

**Imaging Reports:**
```javascript
{
  imagingType: string,
  imagingDate: string,
  findings: string,
  impression: string
}
```

#### User Model (Firestore)

```javascript
{
  uid: string,                 // Firebase UID (document ID)
  email: string,               // User email
  displayName: string,         // Display name
  photoURL: string | null,     // Profile photo URL
  createdAt: Timestamp,        // Account creation
  updatedAt: Timestamp,        // Last update
}
```

---

## Frontend Architecture

```
frontend/src/
├── components/              # React Components
│   ├── Dashboard.tsx        # Main dashboard
│   ├── DocumentUploader.tsx # Upload interface
│   ├── Records.tsx          # Document list view
│   ├── SearchResultsPage.tsx  # Search results
│   ├── Settings.tsx         # User settings
│   └── ...                  # Other components
│
├── services/                # API Client Services
│   ├── chatService.ts       # Chat API calls
│   ├── searchService.ts     # Search API calls
│   ├── documentProcessor.ts # Document API calls
│   └── userService.ts       # User API calls
│
├── hooks/                   # Custom React Hooks
│   ├── useToast.ts          # Toast notifications
│   └── useOnboarding.ts     # Onboarding flow
│
├── utils/                   # Utility Functions
│   ├── formatters.ts        # Date, size formatters
│   └── health-helpers.ts    # Health data helpers
│
├── config/
│   └── api.ts               # API configuration
│
└── App.tsx                  # Main app component
```

**State Management:**
- React useState/useEffect for local state
- Firebase Auth state managed by Firebase SDK
- No global state management library (Redux, etc.) - kept simple

**Routing:**
- React Router for client-side routing
- Protected routes with auth checks

---

## Infrastructure

### Local Development

**Backend:**
- Port: 8080
- Firebase Auth Emulator: 9099 (optional)
- Hot reload with nodemon

**Frontend:**
- Port: 5173
- Vite dev server with HMR

### Cloud Deployment

**Backend (Cloud Run):**
- Region: `europe-west1`
- Serverless container deployment
- Auto-scaling based on traffic
- Environment variables for configuration
- Application Default Credentials (ADC) for GCP services

**Frontend (Firebase Hosting):**
- Deployed via `firebase deploy --only hosting`
- CDN distribution
- HTTPS by default

**Storage:**
- Cloud Storage bucket for documents
- Signed URLs for secure downloads (1-hour expiry)

**Database:**
- Firestore in Native mode
- Location: `europe-west1`
- Indexes for efficient queries

---

## Design Decisions

### Why Singleton Clients?

**Problem:** Each route file was creating new Firestore/Storage instances.

**Solution:** Centralized singleton instances in `config/` directory.

**Benefits:**
- Single connection pool across entire app
- Reduced memory usage
- Better resource management
- Easier to configure and test

### Why Centralized Constants?

**Problem:** Magic numbers and strings duplicated across files (limits, timeouts, error messages).

**Solution:** Single `constants.js` file with all configuration.

**Benefits:**
- Update values in one place
- Consistency across the app
- Easier to tune performance
- Clear documentation of all limits

### Why Standardized Response Utilities?

**Problem:** Error responses formatted inconsistently (some with stack traces, some without).

**Solution:** Response utility functions that handle dev/prod differences.

**Benefits:**
- Consistent API responses
- Automatic handling of dev vs prod (stack traces only in dev)
- Reduced code duplication
- Easier to add features (like logging, monitoring)

### Why Document Analysis Pipeline?

**Problem:** 4-step AI analysis sequence duplicated in multiple places.

**Solution:** Single `analyzeDocument()` function that encapsulates the pipeline.

**Benefits:**
- DRY principle
- Consistent analysis across all documents
- Easy to update/improve analysis
- Centralized error handling

### Why Session Caching?

**Problem:** Chat conversations re-fetching all documents and history on every message.

**Solution:** In-memory cache with TTL and automatic cleanup.

**Benefits:**
- 90% reduction in Firestore reads
- Faster chat responses
- Lower GCP costs
- Better user experience

### Why Query Intent Analysis?

**Problem:** All search queries going through AI (expensive and slow).

**Solution:** Analyze query intent first, route to AI only when needed.

**Benefits:**
- Simple queries (like "show prescriptions") skip AI
- Faster responses for simple queries
- Reduced AI API costs
- Better user experience

---

## Performance Optimizations

1. **Search Caching:** 5-minute TTL cache for search results
2. **Session Caching:** 10-minute TTL for chat sessions
3. **Pre-computed Searchable Text:** Stored in Firestore for fast fuzzy search
4. **Signed URL Caching:** 1-hour expiry for download URLs
5. **Singleton Clients:** Single connection pool for Firestore/Storage
6. **Query Intent Analysis:** Skip AI for simple queries
7. **Document Ranking:** Sort results before sending to AI (top 10-15 only)

---

## Security Measures

1. **Authentication:** All API routes protected with Firebase ID token verification
2. **Authorization:** Document ownership verified before all operations
3. **Immutable Fields:** Prevent users from editing critical fields (userId, storagePath, etc.)
4. **Input Validation:** Validate all user inputs before processing
5. **Signed URLs:** Temporary, expiring URLs for file downloads
6. **Environment Variables:** Sensitive config stored in .env (gitignored)
7. **Session Validation:** Chat sessions validated for user ownership

---

For more details on specific implementations, see:
- [Shared Resources Library](SHARED_RESOURCES.md) - Catalog of all reusable code
- [Testing Guide](backend/tests/README.md) - API testing documentation
- [Development Guidelines](GEMINI.md) - Collaboration and code quality guidelines
