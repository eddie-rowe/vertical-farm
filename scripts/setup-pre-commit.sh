#!/bin/bash

# Setup Pre-commit Hooks for Vertical Farm Project
# This script installs and configures pre-commit hooks for comprehensive code quality

set -e

echo "🚀 Setting up Pre-commit Hooks for Vertical Farm"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f ".pre-commit-config.yaml" ]; then
    echo -e "${RED}❌ Error: .pre-commit-config.yaml not found. Run this from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing pre-commit...${NC}"

# Install pre-commit
if command -v pip3 &> /dev/null; then
    pip3 install pre-commit
elif command -v pip &> /dev/null; then
    pip install pre-commit
else
    echo -e "${RED}❌ Error: pip not found. Please install Python and pip first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ pre-commit installed${NC}"

# Install pre-commit hooks
echo -e "${YELLOW}🔧 Installing pre-commit hooks...${NC}"
pre-commit install

# Install commit message hooks
echo -e "${YELLOW}📝 Installing commit message hooks...${NC}"
pre-commit install --hook-type commit-msg

echo -e "${GREEN}✅ Pre-commit hooks installed${NC}"

# Create secrets baseline if it doesn't exist
if [ ! -f ".secrets.baseline" ]; then
    echo -e "${YELLOW}🔐 Creating secrets baseline...${NC}"
    detect-secrets scan --baseline .secrets.baseline || {
        echo -e "${YELLOW}⚠️  detect-secrets not found, installing...${NC}"
        pip install detect-secrets
        detect-secrets scan --baseline .secrets.baseline
    }
    echo -e "${GREEN}✅ Secrets baseline created${NC}"
fi

# Install frontend dependencies if needed
if [ -f "frontend/package.json" ] && [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

# Install backend dependencies if needed
if [ -f "backend/requirements.txt" ]; then
    echo -e "${YELLOW}🐍 Installing backend dependencies...${NC}"
    if [ -d "backend/venv" ]; then
        source backend/venv/bin/activate
    fi
    pip install -r backend/requirements.txt
    pip install pip-audit  # For dependency security checks
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
fi

# Test the installation
echo -e "${YELLOW}🧪 Testing pre-commit setup...${NC}"
if pre-commit run --all-files --show-diff-on-failure; then
    echo -e "${GREEN}✅ All pre-commit hooks passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some hooks failed. This is normal on first run.${NC}"
    echo -e "${YELLOW}   Run the suggested fixes and commit again.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Pre-commit setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 What's been set up:${NC}"
echo "   • Code formatting (Black, Prettier)"
echo "   • Linting (flake8, ESLint)"
echo "   • Type checking (mypy, TypeScript)"
echo "   • Security scanning (Bandit, TruffleHog)"
echo "   • Dependency analysis"
echo "   • Git commit message validation"
echo ""
echo -e "${YELLOW}💡 Usage:${NC}"
echo "   • Hooks run automatically on 'git commit'"
echo "   • Run manually: 'pre-commit run --all-files'"
echo "   • Skip hooks (emergency): 'git commit --no-verify'"
echo "   • Update hooks: 'pre-commit autoupdate'"
echo ""
echo -e "${GREEN}Happy coding! 🌱${NC}" 