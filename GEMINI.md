# GEMINI.md

## Project Overview

This is a full-stack "HealthVault" application. It includes a React frontend and a Node.js/Express backend.

The application allows users to manage and interact with their health documents. It uses Google Cloud Storage for file storage, Google Cloud Firestore for metadata, and the Google Gemini API for AI-powered features.

This file outlines the development plan and collaboration guidelines for our work together.

## Collaboration Guidelines

-   **Reference Documentation**: Always reference official Google documentation and best practices for all features.
-   **Code Quality**: Prioritize clean, efficient, and scalable code.
-   **Isolated Changes**: When troubleshooting, only make code changes directly related to the issue being addressed. No other changes should be made to UI or app functionality.
-   **Clean Up**: If an attempted solution does not work, remove any unused or redundant code to prevent future issues.
-   **Clarification Over Assumption**: If instructions or next steps are unclear, always ask for clarification before proceeding.

## Development Plan

The backend implementation will be approached in four phases:

### 1. Authentication with Firebase (Complete)
-   **Strategy**: Integrate Firebase Authentication for secure user sign-up, login, and management.
-   **Implementation**: Add the `firebase-admin` SDK to the backend to verify user identity tokens on all protected API routes.

### 2. Core API Endpoint Implementation
-   **Strategy**: Implement the core business logic, turning the backend into a secure proxy for all Google Cloud and Gemini API calls.
-   **Implementation**:
                -   **File Uploads & Storage**: Implement `POST /api/upload` to securely upload files to Google Cloud Storage and save metadata to Firestore.
                -   **AI Analysis**: Implement `/api/analyze` to process uploaded medical documents using Gemini's multimodal capabilities (text + image/PDF analysis).    -   **Data Retrieval**: Implement `GET /api/documents` and `GET /api/documents/:id` to list and retrieve document metadata from Firestore, including generating secure, temporary download URLs from Cloud Storage.
                -   **Search and Chat**: Implement `/api/search` and `/api/chat` endpoints for AI-powered document search and conversational queries.
### 3. Code Refactoring for Scalability
-   **Strategy**: Proactively refactor API routes for better organization and maintainability.
    -   Move the logic for each endpoint into its own file within the `backend/src/routes` directory (e.g., `documents.js`, `chat.js`, `analyze.js`).

### 4. Deployment with Cloud Run
-   **Strategy**: Use Cloud Run for a fully-managed, serverless deployment.
            -   Create a `Dockerfile` for the backend, push the container image to Google Artifact Registry, and deploy it to Cloud Run in the `europe-west1` region.
