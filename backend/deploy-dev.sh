#!/bin/bash

# ============================================================================
# Local Docker Build & Deploy Script for Cloud Run
# ============================================================================
# This script builds the container locally (faster than Cloud Build),
# pushes to Artifact Registry, and deploys to Cloud Run.
#
# Usage: ./deploy-dev.sh
# ============================================================================

set -e  # Exit on error

# Configuration
PROJECT_ID="helpful-beach-476908-p3"
REGION="europe-west1"
SERVICE_NAME="healthvault-backend"
IMAGE_NAME="europe-west1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}"
TAG="latest"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}🚀 Local Docker Build & Deploy to Cloud Run${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Step 1: Build container locally
echo -e "${YELLOW}📦 Step 1/3: Building container locally...${NC}"
docker build -t "${IMAGE_NAME}:${TAG}" .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
else
    echo -e "❌ Build failed!"
    exit 1
fi

# Step 2: Push to Artifact Registry
echo -e "${YELLOW}☁️  Step 2/3: Pushing to Artifact Registry...${NC}"
docker push "${IMAGE_NAME}:${TAG}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Push successful!${NC}"
    echo ""
else
    echo -e "❌ Push failed!"
    echo -e "💡 Tip: Make sure you've run: gcloud auth configure-docker europe-west1-docker.pkg.dev"
    exit 1
fi

# Step 3: Deploy to Cloud Run
echo -e "${YELLOW}🚢 Step 3/3: Deploying to Cloud Run...${NC}"
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}:${TAG}" \
  --region "${REGION}" \
  --platform managed

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
    echo -e "Service URL: ${GREEN}https://${SERVICE_NAME}-605386197791.${REGION}.run.app${NC}"
    echo ""
else
    echo -e "❌ Deployment failed!"
    exit 1
fi
