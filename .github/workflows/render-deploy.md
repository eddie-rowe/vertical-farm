# 
How it works:
Triggers on push to main or manually via the Actions tab.
Builds and deploys the frontend (Node.js/Next.js) and backend (Python/FastAPI) using Render's GitHub Action.
Uses secrets for your Render API key and service IDs.
What you need to do:
In your GitHub repo, go to Settings → Secrets and variables → Actions.
Add these secrets:
RENDER_API_KEY (your Render API key)
RENDER_FRONTEND_SERVICE_ID (your Render frontend service ID)
RENDER_BACKEND_SERVICE_ID (your Render backend service ID)
Once set up, every push to main will build and deploy both services to Render automatically.
Let me know if you want a step-by-step guide for setting up the Render services or secrets!

name: Deploy to Render

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy-frontend:
    name: Build & Deploy Frontend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Render (Frontend)
        uses: render-examples/deploy-to-render-action@v1
        with:
          service-id: ${{ secrets.RENDER_FRONTEND_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  build-and-deploy-backend:
    name: Build & Deploy Backend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      - name: Deploy to Render (Backend)
        uses: render-examples/deploy-to-render-action@v1
        with:
          service-id: ${{ secrets.RENDER_BACKEND_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
