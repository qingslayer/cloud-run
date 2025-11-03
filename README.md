## Project Structure

```
cloud-run/
├── backend/          # Backend API server
│   └── src/
│       ├── routes/   # API routes
│       ├── services/
│       │   └── gemini/  # Gemini AI service integration
│       └── config/   # Backend configuration
├── frontend/         # React frontend application
│   └── src/
│       ├── components/  # React components
│       ├── services/    # Frontend services
│       ├── utils/       # Utility functions
│       └── App.tsx      # Main app component
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v18 or higher
- Google Cloud account project ([create one here](https://console.cloud.google.com/projectcreate))
- gcloud CLI
  - Mac: `brew install google-cloud-sdk`
  - Windows / Linux: [installation guide](https://cloud.google.com/sdk/docs/install)
  - Verify: `gcloud --version`

### Google Cloud Setup

**Important Notes:**
- This project uses the `europe-west1` region (hackathon requirement)
- Replace all instances of `YOUR-PROJECT-ID` with your actual Google Cloud project ID

1. Authenticate and configure
```bash
   gcloud auth login # gcloud CLI
   gcloud auth application-default login # app credentials

   gcloud config set project YOUR-PROJECT-ID
   gcloud config get-value project # verify
```

2. Enable required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable aiplatform.googleapis.com
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

1. Navigate to backend directory:
```bash
   cd backend
```

2. Install dependencies:
```bash
   npm install
```

3. Configure environment variables:
```bash
   cp .env.example .env
```
   Then edit `.env` and set:
   - `GEMINI_API_KEY` - get from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - `PROJECT_ID` - your Google Cloud project ID
   - `STORAGE_BUCKET` - your Cloud Storage bucket name

4. Verify connections:
```bash
   node test-connection.js
```
   Should show ✅ for all three services.

   **If you see ❌ errors:**
```bash
   gcloud auth application-default login           # re-authenticate
   gcloud config get-value project                 # verify project
   gcloud services list --enabled | grep -E "run|storage|firestore" # check APIs
```
   Also double-check your `.env` values.

5. Start the development server:
```bash
   npm run dev
```
   The backend will run on `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
   cd frontend
```

2. Install dependencies:
```bash
   npm install
```

3. Configure environment variables:
```bash
   cp .env.example .env
```
   - Default points to `http://localhost:8080`
   - Update `VITE_API_URL` if your backend runs on a different port

4. Start the development server:
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