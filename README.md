# HealthVault

Personal health records management system with AI-powered document analysis, intelligent search, and conversational chat capabilities.

[![Technology](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20GCP-blue)](#technology-stack)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange)](#ai-features)
[![Deployment](https://img.shields.io/badge/Deploy-Cloud%20Run-green)](#deployment)

---

## 📖 Documentation

- **[Architecture Guide](ARCHITECTURE.md)** - Technical implementation details, API design, data models
- **[Shared Resources Library](SHARED_RESOURCES.md)** - Catalog of all reusable code, utilities, and constants
- **[Testing Guide](backend/tests/README.md)** - API testing documentation and test scripts
- **[Development Guidelines](GEMINI.md)** - Collaboration practices and code quality standards

---

## ✨ Features

### Core Functionality
- **Document Management** - Upload, organize, and manage health documents (PDFs, images)
- **AI-Powered Analysis** - Automatic categorization and data extraction from medical documents
- **Intelligent Search** - Natural language search with query intent detection
- **Conversational Chat** - Ask questions about your health records with context-aware AI
- **Secure Storage** - End-to-end encryption with Firebase Authentication and Cloud Storage

### AI Capabilities
- **Smart Categorization** - Automatically categorizes documents (Lab Results, Prescriptions, Imaging Reports, etc.)
- **Data Extraction** - Extracts structured data (test results, medications, dates, values)
- **Search Optimization** - Generates concise summaries for efficient search
- **Query Routing** - Intelligently routes queries (simple → direct DB, complex → AI)
- **Conversational Memory** - Maintains chat context with session caching

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **Google Cloud Account** ([create project](https://console.cloud.google.com/projectcreate))
  - Required roles: Owner/Editor for the project
  - Firebase Authentication Admin
- **gcloud CLI** ([installation guide](https://cloud.google.com/sdk/docs/install))
- **Gemini API Key** ([get key](https://aistudio.google.com/app/apikey))

### 1. Google Cloud Setup

```bash
# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project YOUR-PROJECT-ID

# Enable required APIs
gcloud services enable run.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com \
  firebase.googleapis.com

# Create resources (region: europe-west1)
gsutil mb -l europe-west1 gs://healthvault-YOUR-PROJECT-ID
gcloud firestore databases create --location=europe-west1
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
#   - GEMINI_API_KEY=your_key_here
#   - GOOGLE_CLOUD_PROJECT=your-project-id
#   - STORAGE_BUCKET=healthvault-your-project-id

# Verify connections
node tests/connection.test.js
# Should show ✅ for Gemini, Storage, Firestore, Firebase

# Start development server
npm run dev
# Backend runs on http://localhost:8080
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Default: VITE_API_URL=http://localhost:8080

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │ ← TypeScript + Vite + TailwindCSS
│  localhost:5173 │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│ Express Backend │ ← Node.js + Express
│  localhost:8080 │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌─────┐ ┌────────┐ ┌────────┐
│Firebase│ │ GCS │ │Firestore│ │Gemini │
│  Auth  │ │     │ │        │ │  AI   │
└────────┘ └─────┘ └────────┘ └────────┘
```

**For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md)**

---

## 🛠️ Technology Stack

### Backend
- **Framework:** Express.js (Node.js)
- **Authentication:** Firebase Authentication
- **Database:** Google Cloud Firestore
- **Storage:** Google Cloud Storage
- **AI:** Google Gemini AI (Gemini 1.5 Flash)
- **Caching:** In-memory (session & search caching)
- **File Processing:** Multer, Sharp
- **Search:** Fuse.js (fuzzy search)

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Routing:** React Router
- **State:** React Hooks (useState, useEffect)
- **Auth:** Firebase SDK

### Infrastructure
- **Deployment:** Google Cloud Run (backend), Firebase Hosting (frontend)
- **Region:** europe-west1
- **CI/CD:** GitHub Actions (optional)

---

## 📚 API Documentation

### Core Endpoints

**Documents:**
- `GET /api/documents` - List documents (with filters & pagination)
- `GET /api/documents/:id` - Get document + download URL
- `POST /api/documents/upload` - Upload new document
- `PATCH /api/documents/:id` - Update metadata
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/analyze` - Trigger AI analysis
- `POST /api/documents/search` - Intelligent search

**Chat:**
- `POST /api/chat` - Send message (with optional sessionId)
- `POST /api/chat/end-session` - End chat session

**Users:**
- `POST /api/users` - Initialize/update profile
- `GET /api/users/:uid` - Get profile
- `PATCH /api/users/:uid` - Update profile

**All routes require Firebase ID token:** `Authorization: Bearer <token>`

**For complete API details, see [ARCHITECTURE.md](ARCHITECTURE.md#api-design)**

---

## 🧪 Testing

### Quick Verification

```bash
cd backend

# Test all GCP connections
node tests/connection.test.js

# Should show ✅ for:
# - Gemini AI
# - Cloud Storage
# - Firestore
# - Firebase Auth
```

### Feature Tests

Comprehensive test suite covering all endpoints:

```bash
# Document tests
node tests/documents/upload.test.js ~/path/to/file.pdf
node tests/documents/list-documents.test.js
node tests/documents/analyze-document.test.js ~/path/to/file.pdf

# Search tests
node tests/search/simple.test.js
node tests/search/semantic.test.js
node tests/search/answer.test.js

# Chat tests
node tests/chat/chat.test.js
node tests/chat/chat-caching.test.js
```

**For detailed testing guide, see [backend/tests/README.md](backend/tests/README.md)**

---

## 🚢 Deployment

### Backend (Cloud Run)

```bash
cd backend

# Build and deploy
gcloud run deploy healthvault-backend \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,GEMINI_API_KEY=your_key,..."
```

### Frontend (Firebase Hosting)

```bash
cd frontend

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

---

## 📂 Project Structure

```
cloud-run/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── config/             # Configuration (Firebase, Firestore, Storage, Constants)
│   │   ├── middleware/         # Auth middleware
│   │   ├── routes/             # API routes (documents, chat, users)
│   │   ├── services/           # Business logic (AI, caching, ranking, search)
│   │   ├── utils/              # Shared utilities (responses, auth helpers)
│   │   └── server.js           # Express app entry point
│   └── tests/                  # API integration tests
│
└── frontend/                   # React + TypeScript frontend
    └── src/
        ├── components/         # React components
        ├── services/           # API client services
        ├── hooks/              # Custom React hooks
        ├── utils/              # Utility functions
        └── App.tsx             # Main app component
```

**For detailed structure, see [ARCHITECTURE.md](ARCHITECTURE.md#backend-project-structure)**

---

## 🔧 Development

### Before Building a New Feature

1. **Check [SHARED_RESOURCES.md](SHARED_RESOURCES.md)** - Don't duplicate existing code!
2. **Use existing utilities** - Constants, response helpers, auth utilities, AI services
3. **Follow patterns** - See [GEMINI.md](GEMINI.md) for guidelines
4. **Write tests** - Add integration tests for new endpoints

### Code Quality Principles

- **DRY (Don't Repeat Yourself)** - Use shared utilities and constants
- **Singleton Pattern** - Use existing Firestore/Storage instances
- **Standardized Responses** - Use response utility functions
- **Security First** - Verify auth on all protected routes
- **Performance** - Use caching where appropriate

**For complete guidelines, see [GEMINI.md](GEMINI.md)**

---

## 🤝 Contributing

1. Follow the development guidelines in [GEMINI.md](GEMINI.md)
2. Check [SHARED_RESOURCES.md](SHARED_RESOURCES.md) before adding new utilities
3. Update documentation when adding features
4. Write tests for new endpoints
5. Maintain code quality and consistency

---

## 📝 License

This project is for educational and demonstration purposes.

---

## 🔗 Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [Gemini API Studio](https://aistudio.google.com/)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

---

**For questions or issues, please refer to the documentation files linked at the top of this README.**
