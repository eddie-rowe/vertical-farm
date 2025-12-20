# Quickstart Guide

Get the Vertical Farm platform running locally in **5 minutes**.

## 🎯 Goal

By the end of this guide, you'll have:
- ✅ The complete application stack running locally
- ✅ Frontend at http://localhost:3000
- ✅ Backend API at http://localhost:8000
- ✅ Local Supabase database with Studio UI
- ✅ Ready to develop without cloud dependencies

## 🚀 Quick Start with Supabase CLI (Recommended)

**Prerequisites:** Docker, Supabase CLI, and Git installed

```bash
# 1. Clone the repository
git clone https://github.com/eddie-rowe/vertical-farm.git
cd vertical-farm

# 2. Start Supabase (local database + auth + realtime)
supabase start

# 3. Run the setup script
chmod +x scripts/setup-local-dev.sh
./scripts/setup-local-dev.sh

# 4. Access everything
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# Supabase Studio: http://localhost:54323
```

That's it! 🎉 You now have a complete local development environment.

## 🛠️ Option 2: Manual Setup

**Prerequisites:** Node.js 18+, Python 3.13+, Supabase CLI

```bash
# 1. Clone the repository
git clone https://github.com/eddie-rowe/vertical-farm.git
cd vertical-farm

# 2. Start Supabase (Terminal 1)
supabase start
# Note the anon key and service_role key from the output

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with the keys from supabase status

# 4. Start the backend (Terminal 2)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 5. Start the frontend (Terminal 3)  
cd frontend
npm install
npm run dev
```

## 🌐 What's Running?

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js 15 React application |
| **Backend API** | http://localhost:8000 | FastAPI Python backend |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Supabase Studio** | http://localhost:54323 | Database management UI |
| **Supabase API** | http://localhost:54321 | Local Supabase REST API |
| **Inbucket Email** | http://localhost:54324 | Email testing interface |

## 🧪 Quick Test

Verify everything works:

1. **Visit Frontend**: http://localhost:3000
2. **Check API Health**: http://localhost:8000/health
3. **Browse API Docs**: http://localhost:8000/docs

You should see the Vertical Farm dashboard and be able to interact with the API!

## 🗝️ Environment Variables

The Supabase CLI automatically generates all necessary keys for local development:

```bash
# Get your local credentials
supabase status

# This will show:
# API URL: http://localhost:54321          # Use for SUPABASE_URL
# anon key: eyJ...                         # Use for SUPABASE_ANON_KEY  
# service_role key: eyJ...                 # Use for SUPABASE_SERVICE_KEY
```

Your `.env.local` should contain:
```bash
# Frontend
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_status

# Backend  
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your_service_role_key_from_status
```

> 💡 **Note**: The setup script handles this automatically!

### Login to application

1. Visit [http://localhost:3000/login](http://localhost:3000/login)
2. You can now log into the application using:
  - Email: testuser123@gmail.com
  - Password: testpassword123

## 🚦 Next Steps

Now that it's running:

- 🏗️ **Understand the Architecture** → [Architecture Overview](./architecture.md)
- 📚 **Learn about features** → [Guides](./guides/README.md)
- 🛠️ **Start contributing** → [Development Guide](./development/README.md)
- 📖 **Coding standards** → [CLAUDE.md](/CLAUDE.md)

## ❓ Troubleshooting

**Supabase won't start?**
```bash
# Check if ports are in use
lsof -i :54321  # Supabase API
lsof -i :54322  # PostgreSQL

# Stop and clean up
supabase stop
supabase db reset  # Warning: This deletes all data!
supabase start
```

**Port conflicts?**
```bash
# For app services
docker-compose -f docker-compose-with-supabase-cli.yml down
docker-compose -f docker-compose-with-supabase-cli.yml up -d

# Or change ports in manual setup:
uvicorn app.main:app --port 8080  # Backend on 8080
npm run dev -- --port 3001        # Frontend on 3001
```

**Database connection issues?**
```bash
# Check Supabase is running
supabase status

# View Supabase logs
supabase logs

# Restart everything
supabase stop
supabase start
./scripts/setup-local-dev.sh
```

**Still stuck?** Check the [Troubleshooting Guide](./guides/troubleshooting.md) or open an issue on GitHub.

---

*🎉 **Success!** You now have a working Vertical Farm platform. Ready to explore?*