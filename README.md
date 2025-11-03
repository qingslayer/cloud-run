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

## Run Locally

**Prerequisites:**  Node.js (v18 or higher)

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

4. Start the development server:
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