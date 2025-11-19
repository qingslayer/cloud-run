# HealthVault

Personal health records management system with AI-powered document analysis and search.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

HealthVault is a full-stack application that helps users manage their personal health records with AI-powered features:

**Core Features:**
- 📄 **Document Management** - Upload, organize, and manage health documents
- 🤖 **AI Analysis** - Automatic extraction of structured data from documents
- 🔍 **Smart Search** - Semantic search with natural language queries
- 💬 **AI Chat** - Conversational interface to query your health data
- 🎨 **Modern UI** - Clean, responsive design with dark mode support
- 🔐 **Secure** - Firebase authentication with encrypted cloud storage

---

## Quick Start

### Prerequisites

- Node.js v18 or higher
- Google Cloud account ([create one here](https://console.cloud.google.com/projectcreate))
- gcloud CLI ([installation guide](https://cloud.google.com/sdk/docs/install))

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd cloud-run
```

2. **Set up Google Cloud** (see [detailed setup](#google-cloud-setup))
```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
```

3. **Start the backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

4. **Start the frontend**
```bash
cd frontend
npm install
npm run dev
```

5. **Open** `http://localhost:5173`

---

## Documentation

**For detailed information, see:**

- **[Shared Resources](docs/SHARED_RESOURCES.md)** - Catalog of all reusable components, hooks, utilities (⭐ **Reference this when building!**)
- **[Frontend Architecture](docs/FRONTEND.md)** - Frontend technical details, patterns, and best practices
- **[Getting Started](#getting-started)** - Detailed setup instructions (below)
- **[Testing Guide](backend/tests/README.md)** - API testing documentation

---

## Project Structure

```
cloud-run/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   │   ├── ai.js           # AI operations (chat, search)
│   │   │   └── documents.js    # Document CRUD
│   │   ├── services/
│   │   │   └── gemini/         # AI service layer
│   │   │       ├── chatService.js
│   │   │       ├── searchService.js
│   │   │       └── documentProcessor.js
│   │   ├── middleware/
│   │   │   └── auth.js         # Authentication
│   │   └── server.js           # Express app entry point
│   └── tests/                  # API integration tests
│
├── frontend/                   # React + TypeScript frontend
│   └── src/
│       ├── components/         # UI components (90+)
│       │   ├── common/         # ⭐ Reusable components
│       │   ├── icons/          # Icon components (50+)
│       │   └── illustrations/  # SVG illustrations
│       ├── config/             # ⭐ Centralized configuration
│       │   ├── constants.ts    # Categories, timeouts, storage keys
│       │   ├── messages.ts     # UI messages & errors
│       │   ├── api.ts          # API configuration
│       │   └── firebase.ts     # Firebase config
│       ├── hooks/              # ⭐ Custom React hooks
│       │   ├── useToast.ts
│       │   ├── useOnboarding.ts
│       │   └── useClickOutside.ts
│       ├── services/           # Backend API clients
│       │   ├── documentProcessor.ts
│       │   ├── chatService.ts
│       │   ├── searchService.ts
│       │   └── userService.ts
│       ├── utils/              # ⭐ Utility functions
│       │   ├── formatters.ts
│       │   ├── category-info.ts
│       │   └── health-helpers.ts
│       ├── types.ts            # TypeScript definitions
│       └── App.tsx             # Main application
│
└── docs/                       # 📚 Documentation
    ├── SHARED_RESOURCES.md     # ⭐ Component/hook/util catalog
    └── FRONTEND.md             # Frontend architecture guide
```

⭐ = **Check these directories first when building new features!**

---

## Technology Stack

### Backend
- **Express.js** - Web framework
- **Google Cloud Storage** - Document storage
- **Firestore** - Document metadata database
- **Gemini AI** - Document analysis and conversational AI
- **Firebase Auth** - Authentication
- **Multer** - File upload handling

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling with dark mode
- **Firebase** - Authentication client

### Infrastructure
- **Cloud Run** - Serverless deployment (europe-west1)
- **Artifact Registry** - Container registry

---

## Getting Started

### Google Cloud Setup

**Important:** This project uses the `europe-west1` region.

**1. Authenticate and configure:**
```bash
gcloud auth login                           # gcloud CLI
gcloud auth application-default login       # app credentials

gcloud config set project YOUR-PROJECT-ID
gcloud config get-value project             # verify
```

**2. Enable required APIs:**
```bash
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable firebase.googleapis.com
```

**3. Create required resources:**
```bash
# Storage bucket
gsutil mb -l europe-west1 gs://healthvault-YOUR-PROJECT-ID

# Firestore database
gcloud firestore databases create --location=europe-west1
```

---

### Backend Setup

**1. Install dependencies:**
```bash
cd backend
npm install
```

**2. Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` and set:
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `GOOGLE_CLOUD_PROJECT` - Your GCP project ID
- `STORAGE_BUCKET` - Your bucket name (e.g., `healthvault-YOUR-PROJECT-ID`)

**3. Verify connections:**
```bash
node tests/connection.test.js
```

Should show ✅ for all services (Gemini, Storage, Firestore, Firebase).

**Troubleshooting:**
```bash
gcloud auth application-default login
gcloud config get-value project
gcloud services list --enabled | grep -E "run|storage|firestore|firebase"
```

**4. Start development server:**
```bash
npm run dev
```

Backend runs on `http://localhost:8080`

---

### Frontend Setup

**1. Install dependencies:**
```bash
cd frontend
npm install
```

**2. Configure environment:**
```bash
cp .env.example .env
```

Default points to `http://localhost:8080`. Update `VITE_API_URL` if needed.

**3. Start development server:**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Development

### Code Organization

**Before building new features:**
1. 📖 **Check** [docs/SHARED_RESOURCES.md](docs/SHARED_RESOURCES.md) - Don't duplicate existing code!
2. 🔧 **Reuse** existing components, hooks, and utilities
3. 📝 **Follow** patterns in [docs/FRONTEND.md](docs/FRONTEND.md)
4. ✅ **Update** documentation when adding shared code

### API Endpoints

**Document Management:**
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `POST /api/documents/upload` - Upload new document
- `PATCH /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/analyze` - Trigger AI analysis

**AI Features:**
- `POST /api/search` - Universal search (semantic, Q&A, or chat)
- `POST /api/chat` - Conversational AI with context

**Health:**
- `GET /health` - Health check

---

## Testing

### Connection Test

Verify GCP service connections:

```bash
cd backend
node tests/connection.test.js
```

### API Tests

Comprehensive API test suite:

```bash
cd backend
node tests/<category>/<test-name>.test.js
```

**Categories:**
- `documents/` - Document management tests
- `chat/` - Chat functionality tests
- `search/` - Search functionality tests

For detailed testing guide, see [backend/tests/README.md](backend/tests/README.md).

---

## Deployment

### Backend Deployment (Cloud Run)

**1. Build container:**
```bash
cd backend
docker build -t gcr.io/YOUR-PROJECT-ID/healthvault-backend .
```

**2. Push to Artifact Registry:**
```bash
docker push gcr.io/YOUR-PROJECT-ID/healthvault-backend
```

**3. Deploy to Cloud Run:**
```bash
gcloud run deploy healthvault-backend \
  --image gcr.io/YOUR-PROJECT-ID/healthvault-backend \
  --region europe-west1 \
  --allow-unauthenticated
```

### Frontend Deployment

**1. Build for production:**
```bash
cd frontend
npm run build
```

**2. Deploy static files:**

Deploy the `/dist` directory to your preferred hosting:
- Firebase Hosting
- Vercel
- Netlify
- Cloud Storage + CDN

---

## Contributing

### Code Standards

- **TypeScript** - Use proper typing, avoid `any`
- **Components** - Keep them small and focused
- **Reusability** - Extract common code to shared locations
- **Documentation** - Update docs when adding shared resources
- **Testing** - Write tests for new features (when test suite is set up)

### Development Workflow

1. Check [SHARED_RESOURCES.md](docs/SHARED_RESOURCES.md) for existing code
2. Create feature branch
3. Make changes following existing patterns
4. Update documentation if adding shared code
5. Test thoroughly
6. Create pull request

---

## Resources

- [Shared Resources Catalog](docs/SHARED_RESOURCES.md) - ⭐ **Start here when building!**
- [Frontend Architecture](docs/FRONTEND.md) - Technical details and patterns
- [Backend Tests](backend/tests/README.md) - API testing guide
- [Google Cloud Docs](https://cloud.google.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [React Docs](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com)

---

## License

[Your License Here]

---

## Support

For questions or issues:
- Check the [documentation](docs/)
- Review [SHARED_RESOURCES.md](docs/SHARED_RESOURCES.md) for existing solutions
- Open an issue on GitHub

---

**Built with ❤️ using Google Cloud Platform and Gemini AI**
