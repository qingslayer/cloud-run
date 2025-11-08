# HealthVault

Personal health records management system with AI-powered document analysis and search.

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Google Cloud Setup](#google-cloud-setup)
- [Run Locally](#run-locally)
- [API Endpoints](#api-endpoints)
- [Technology Stack](#technology-stack)
- [Testing](#testing)

---

## Project Structure

```
cloud-run/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   │   ├── ai.js           # AI operations (chat, search, processing)
│   │   │   └── documents.js    # Document CRUD
│   │   ├── services/
│   │   │   └── gemini/         # AI service layer (server-only)
│   │   │       ├── client.js
│   │   │       ├── chatService.js
│   │   │       ├── searchService.js
│   │   │       └── documentProcessor.js
│   │   ├── middleware/
│   │   │   └── auth.js         # Authentication
│   │   └── server.js           # Express app entry point
│   └── tests/                  # API integration tests
│
└── frontend/                   # React + TypeScript frontend
    └── src/
        ├── components/         # UI components
        ├── services/           # Backend API clients
        │   ├── chatService.ts
        │   ├── searchService.ts
        │   └── documentProcessor.ts
        ├── config/
        │   └── api.ts          # API configuration
        └── App.tsx             # Main app component
```

## Getting Started

### Prerequisites
- Node.js v18 or higher
- Google Cloud account project ([create one here](https://console.cloud.google.com/projectcreate))
   - Required permissions: ([update here](https://console.cloud.google.com/iam-admin/iam))
      - Owner / Editor for the Cloud Project
      - Firebase Authentication Admin
- gcloud CLI
  - Mac: `brew install google-cloud-sdk`
  - Windows / Linux: [installation guide](https://cloud.google.com/sdk/docs/install)
  - Verify: `gcloud --version`
- Gemini API

### Google Cloud Setup

**Important Notes:**
- This project uses the `europe-west1` region (hackathon requirement)
- Replace all instances of `YOUR-PROJECT-ID` with your actual Google Cloud project ID

1. Authenticate and configure
```bash
   gcloud auth login                           # gcloud CLI
   gcloud auth application-default login       # app credentials

   gcloud config set project YOUR-PROJECT-ID
   gcloud config get-value project             # verify
```

2. Enable required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable firebase.googleapis.com
```

3. Create required resources
```bash
# Storage bucket
gsutil mb -l europe-west1 gs://healthvault-YOUR-PROJECT-ID

# Firestore
gcloud firestore databases create --location=europe-west1
```

## Run Locally

### Backend Setup

**1. Navigate to backend directory:**
```bash
cd backend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and set:
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `PROJECT_ID` - Your Google Cloud project ID
- `STORAGE_BUCKET` - Your Cloud Storage bucket name (e.g., `healthvault-YOUR-PROJECT-ID`)

**4. Verify connections:**
```bash
node tests/connection.test.js
```

Should show ✅ for all four services (Gemini, Storage, Firestore, Firebase).

**If you see ❌ errors:**
```bash
gcloud auth application-default login                 # re-authenticate
gcloud auth application-default print-access-token    # confirm auth access
gcloud config get-value project                       # verify project
gcloud services list --enabled | grep -E "run|storage|firestore|firebase" # check APIs
```
Also double-check your `.env` values.

**5. Start the development server:**
```bash
npm run dev
```

The backend will run on `http://localhost:8080`

### Frontend Setup

**1. Navigate to frontend directory:**
```bash
cd frontend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Configure environment variables:**
```bash
cp .env.example .env
```

Default points to `http://localhost:8080`. Update `VITE_API_URL` if your backend runs on a different port.

**4. Start the development server:**
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### API Endpoints

The backend provides the following endpoints:
- `GET /health` - Health check
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `POST /api/upload` - Upload a new document
- `POST /api/search` - AI-powered document search
- `POST /api/chat` - Chat with AI assistant
- `DELETE /api/documents/:id` - Delete a document

### Technology Stack

**Backend:**
- Express.js - Web framework
- Google Cloud Storage - Document storage
- Firestore - Document metadata
- Gemini AI - Document analysis and chat
- Multer - File upload handling

**Frontend:**
- React + TypeScript
- Vite - Build tool
- TailwindCSS - Styling

---

## Testing

### Connection Test

Verify your GCP service connections before running the app:

```bash
cd backend
node tests/connection.test.js
```

Should show ✅ for all four services (Gemini, Storage, Firestore, Firebase).

### Feature Tests

The backend includes comprehensive API tests. See [`backend/tests/README.md`](backend/tests/README.md) for:
- Document management tests (upload, list, get, edit, delete, analyze)
- Chat tests (basic conversation, session caching)
- Search tests (simple, semantic, answer, chat)

**Quick start:**
```bash
cd backend
node tests/<category>/<test-name>.test.js
```

For detailed test documentation, setup instructions, and troubleshooting, see the [Testing Guide](backend/tests/README.md).