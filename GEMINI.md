# GEMINI.md

## Project Overview

This project is the backend API server for the "HealthVault" application. It is a Node.js application built with Express.js.

The primary purpose of this application is to manage and interact with user-uploaded health documents. It uses Google Cloud Storage for file storage and Google Cloud Firestore for metadata. The application also integrates with the Google Gemini API for AI-powered features like document search and chat.

The project is in a development state. The frontend was prototyped in Google AI Studio and the backend is being implemented to support it.

## Collaboration Guidelines

-   **Reference Documentation**: Always reference official Google documentation and best practices for all features.
-   **Code Quality**: Prioritize clean, efficient, and scalable code.
-   **Isolated Changes**: When troubleshooting, only make code changes directly related to the issue being addressed. No other changes should be made to UI or app functionality.
-   **Clean Up**: If an attempted solution does not work, remove any unused or redundant code to prevent future issues.
-   **Clarification Over Assumption**: If instructions or next steps are unclear, always ask for clarification before proceeding.

## Development Plan

The backend implementation will be approached in four phases:

### 1. Authentication with Firebase
-   **Strategy**: Integrate Firebase Authentication for secure user sign-up, login, and management.
-   **Implementation**: Add the `firebase-admin` SDK to the backend to verify user identity tokens on all protected API routes.

### 2. Core API Endpoint Implementation
-   **Strategy**: Implement the core business logic, turning the backend into a secure proxy for all Google Cloud and Gemini API calls.
-   **Implementation**:
    -   **Secure Gemini Calls**: Move all Gemini API interactions from the frontend to the backend to protect the API key.
    -   **File Uploads & Storage**: Implement `POST /api/upload` to securely upload files to Google Cloud Storage and save metadata to Firestore.
    -   **Data Retrieval**: Implement `GET /api/documents` and `GET /api/documents/:id` to list and retrieve document metadata from Firestore, including generating secure, temporary download URLs from Cloud Storage.
    -   **Search and Chat**: Implement the `/api/search` and `/api/chat` endpoints to handle AI-powered features via the backend.

### 3. Code Refactoring for Scalability
-   **Strategy**: Proactively refactor API routes for better organization and maintainability.
-   **Implementation**: Move the logic for each endpoint into its own file within the `backend/src/routes` directory (e.g., `documents.js`, `chat.js`).

### 4. Deployment with Cloud Run
-   **Strategy**: Use Cloud Run for a fully-managed, serverless deployment.
-   **Implementation**: Create a `Dockerfile` for the backend, push the container image to Google Artifact Registry, and deploy it to Cloud Run.

## Building and Running

### Prerequisites

-   Node.js
-   A Google Cloud project with Firestore and Cloud Storage enabled.
-   A Gemini API key.

### Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Create a `.env` file by copying the `.env.example` file and filling in the required environment variables:
    ```bash
    cp .env.example .env
    ```

### Running the Application

-   **Development Mode (with hot-reloading):**
    ```bash
    npm run dev
    ```

-   **Production Mode:**
    ```bash
    npm start
    ```

The server will start on the port defined in the `.env` file (default is 8080).

## Development Conventions

### API Endpoints

The main API endpoints are:

-   `GET /health`: Health check.
-   `GET /api/documents`: List documents.
-   `GET /api/documents/:id`: Get a single document.
-   `POST /api/upload`: Upload a new document.
-   `DELETE /api/documents/:id`: Delete a document.
-   `POST /api/search`: AI-powered document search.
-   `POST /api/chat`: Chat with an AI assistant about documents.

### Code Style

The project uses ES modules (`import`/`export` syntax). There are no explicit linting or formatting configurations found in `package.json`, but the existing code follows a consistent style.

### Dependencies

-   **Express.js:** Web framework.
-   **@google-cloud/firestore:** Firestore database client.
-   **@google-cloud/storage:** Cloud Storage client.
-   **@google/generative-ai:** Gemini API client.
-   **multer:** Middleware for handling file uploads.
-   **dotenv:** For loading environment variables.
-   **cors:** For enabling Cross-Origin Resource Sharing.