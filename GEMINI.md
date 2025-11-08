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
- **Strategy**: Integrate Firebase Authentication for secure user sign-up, login, and management.
- **Implementation**: Add the `firebase-admin` SDK to the backend to verify user identity tokens on all protected API routes.

### 2. Core API Endpoint Implementation (In Progress)
- **Strategy**: Implement the core business logic for document management and AI-powered features.
- **Implementation**:
    - **Document CRUD Operations (Complete)**:
        - `POST /api/documents/upload`: Securely upload files to Google Cloud Storage and save metadata to Firestore.
        - `GET /api/documents`: List all documents for the authenticated user with filtering and pagination.
        - `GET /api/documents/:id`: Retrieve a single document's metadata and a secure download URL.
        - `PATCH /api/documents/:id`: Edit a document's metadata (e.g., `displayName`, `category`, `notes`).
        - `DELETE /api/documents/:id`: Permanently delete a document from Cloud Storage and Firestore.
    - **AI-Powered Features (In Progress)**:
        - `/api/documents/search`: A unified search endpoint that intelligently routes user queries.
            -   **Simple Queries:** For simple queries (e.g., "show all prescriptions"), it performs a direct Firestore query without using AI.
            -   **Semantic Queries:** For more complex queries (e.g., "blood pressure readings"), it uses AI to provide a summary of relevant documents.
            -   **Q&A Queries:** For direct questions (e.g., "what were my cholesterol levels?"), it uses AI to provide a direct answer with citations.
            -   **Chat Queries:** For conversational queries (e.g., "why is my cholesterol high?"), it initiates a new chat session.
        - `/api/chat`: A dedicated endpoint for handling conversational follow-ups, using a `sessionId` to maintain context.
        - `/api/documents/:id/analyze`: An endpoint to trigger the AI analysis of a specific document.

### 3. Deployment with Cloud Run
-   **Strategy**: Use Cloud Run for a fully-managed, serverless deployment.
            -   Create a `Dockerfile` for the backend, push the container image to Google Artifact Registry, and deploy it to Cloud Run in the `europe-west1` region.
