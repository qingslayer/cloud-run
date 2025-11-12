#!/bin/bash

# ============================================================================
# Setup Verification Script
# ============================================================================
# This script checks if everything is configured for local Docker builds
# ============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}🔍 Verifying Local Docker Build Setup${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

ALL_GOOD=true

# Check 1: Docker installed
echo -n "Checking Docker installation... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ ${DOCKER_VERSION}${NC}"
else
    echo -e "${RED}❌ Docker not found${NC}"
    echo -e "${YELLOW}   Install from: https://www.docker.com/products/docker-desktop${NC}"
    ALL_GOOD=false
fi

# Check 2: Docker daemon running
echo -n "Checking Docker daemon... "
if docker ps &> /dev/null; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    echo -e "${YELLOW}   Start Docker Desktop${NC}"
    ALL_GOOD=false
fi

# Check 3: gcloud installed
echo -n "Checking gcloud CLI... "
if command -v gcloud &> /dev/null; then
    GCLOUD_VERSION=$(gcloud version --format="value(core.version)")
    echo -e "${GREEN}✅ Version ${GCLOUD_VERSION}${NC}"
else
    echo -e "${RED}❌ gcloud not found${NC}"
    echo -e "${YELLOW}   Install from: https://cloud.google.com/sdk/docs/install${NC}"
    ALL_GOOD=false
fi

# Check 4: Artifact Registry auth
echo -n "Checking Artifact Registry auth... "
if grep -q "europe-west1-docker.pkg.dev" ~/.docker/config.json 2>/dev/null; then
    echo -e "${GREEN}✅ Configured${NC}"
else
    echo -e "${RED}❌ Not configured${NC}"
    echo -e "${YELLOW}   Run: gcloud auth configure-docker europe-west1-docker.pkg.dev${NC}"
    ALL_GOOD=false
fi

# Check 5: Deploy script exists and is executable
echo -n "Checking deploy script... "
if [ -x "./deploy-dev.sh" ]; then
    echo -e "${GREEN}✅ Ready${NC}"
else
    echo -e "${RED}❌ Not executable${NC}"
    echo -e "${YELLOW}   Run: chmod +x deploy-dev.sh${NC}"
    ALL_GOOD=false
fi

# Check 6: Dockerfile exists
echo -n "Checking Dockerfile... "
if [ -f "./Dockerfile" ]; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
    ALL_GOOD=false
fi

# Check 7: .dockerignore exists
echo -n "Checking .dockerignore... "
if [ -f "./.dockerignore" ]; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${YELLOW}⚠️  Missing (optional but recommended)${NC}"
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ All checks passed! You're ready to deploy.${NC}"
    echo ""
    echo -e "To deploy, run: ${BLUE}./deploy-dev.sh${NC}"
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
fi

echo -e "${BLUE}============================================================================${NC}"
echo ""
