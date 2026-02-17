# ResumeAI — Full Stack Setup Guide

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18 + Vite + TypeScript + Tailwind CSS   |
| Routing    | React Router v6                               |
| State      | Zustand + TanStack Query                      |
| Backend    | Node.js + Express + TypeScript                |
| Database   | PostgreSQL + Prisma ORM                       |
| Auth       | Microsoft OAuth 2.0 + JWT sessions            |
| AI         | OpenAI GPT-4o / GPT-4o-mini                   |
| Dev Runner | tsx (hot reload, no compile step needed)      |

---

## Prerequisites

Install these before starting:

```bash
# Node.js 20+
node --version   # should be v20 or v22

# PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# PostgreSQL (Ubuntu/Debian)
sudo apt update && sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# PostgreSQL (Windows)
# Download installer from https://www.postgresql.org/download/windows/
```

---

## 1. Clone & Install

```bash
# Clone the repo
git clone https://github.com/yourname/resumeai.git
cd resumeai

# Install all workspace dependencies
npm install
cd frontend && npm install && cd ..
cd backend  && npm install && cd ..
```

---

## 2. Set Up PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# In the psql shell, run:
CREATE DATABASE resumeai_dev;
CREATE USER resumeai_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE resumeai_dev TO resumeai_user;
\q
```

---

## 3. Configure Environment Variables

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://resumeai_user:your_password@localhost:5432/resumeai_dev"
JWT_SECRET="run: openssl rand -hex 64"
MICROSOFT_CLIENT_ID="from Azure Portal"
MICROSOFT_CLIENT_SECRET="from Azure Portal"
MICROSOFT_TENANT_ID="common"
OPENAI_API_KEY="sk-..."
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:4000"
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
```

`frontend/.env.local` (defaults are fine for local dev):
```env
VITE_API_URL=http://localhost:4000
```

---

## 4. Set Up Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com) → **App registrations** → **New registration**
2. Name: `ResumeAI`
3. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
4. Redirect URI: `http://localhost:4000/api/auth/microsoft/callback` (Web platform)
5. Click **Register**
6. Copy **Application (client) ID** → `MICROSOFT_CLIENT_ID`
7. Go to **Certificates & secrets** → New client secret → Copy value → `MICROSOFT_CLIENT_SECRET`
8. Tenant ID: use `common` for both personal + org accounts

---

## 5. Run Prisma Migrations

```bash
cd backend

# Push schema to database (creates all tables)
npx prisma db push

# Verify tables were created
npx prisma studio
# Opens at http://localhost:5555 — you can browse/edit data here
```

---

## 6. Start Development Servers

### Option A — Both at once (from root)

```bash
# In the root resumeai/ directory
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:4000
```

### Option B — Separate terminals

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## 7. Verify Everything Works

```bash
# Health check
curl http://localhost:4000/health
# Should return: {"status":"ok","timestamp":"...","version":"1.0.0"}

# Then open http://localhost:5173 in your browser
# Click "Continue with Microsoft" to test the full OAuth flow
```

---

## Project Structure

```
resumeai/
├── package.json            ← Root workspace config
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts      ← Vite + proxy to backend
│   ├── tailwind.config.js  ← Design tokens (colors, fonts, animations)
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx        ← App entry (QueryClient, Router, Toaster)
│       ├── App.tsx         ← Routes + auth guard
│       ├── index.css       ← Tailwind + custom classes
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx   ← Sidebar shell
│       │   │   ├── Sidebar.tsx     ← Nav + user chip
│       │   │   └── DarkOrbs.tsx    ← Background effect
│       │   └── ats/
│       │       └── ScoreRing.tsx   ← Reusable SVG donut
│       ├── pages/
│       │   ├── LoginPage.tsx       ← Vibrant warm login + Microsoft OAuth
│       │   ├── DashboardPage.tsx   ← Stats, CTA, resume list
│       │   ├── BuilderPage.tsx     ← JD input, dropzone, analyze
│       │   └── ATSPage.tsx         ← Animated score, bars, keywords
│       ├── store/
│       │   └── authStore.ts        ← Zustand auth state + persist
│       ├── hooks/                  ← Custom React hooks (add as needed)
│       └── lib/
│           ├── api.ts              ← Axios instance + interceptors
│           └── utils.ts            ← cn(), scoreColor(), etc.
│
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── prisma/
    │   └── schema.prisma       ← User, Resume, ATSAnalysis, Export models
    └── src/
        ├── index.ts            ← Express app + middleware
        ├── db/
        │   └── prisma.ts       ← Prisma singleton
        ├── middleware/
        │   ├── auth.ts         ← requireAuth / JWT verification
        │   └── errorHandler.ts ← Global error handler
        ├── routes/
        │   ├── auth.ts         ← OAuth + JWT + logout
        │   ├── resumes.ts      ← CRUD for resumes
        │   ├── ats.ts          ← ATS analysis + scoring
        │   └── export.ts       ← PDF/TXT export
        └── services/
            └── atsService.ts   ← OpenAI: extract keywords, score, suggest
```

---

## API Reference

### Auth
```
GET  /api/auth/microsoft                → Redirect to Microsoft login
GET  /api/auth/microsoft/callback       → OAuth callback, returns JWT
GET  /api/auth/me              [auth]   → Get current user
POST /api/auth/logout          [auth]   → Revoke current session
DELETE /api/auth/sessions      [auth]   → Revoke ALL sessions
```

### Resumes
```
GET    /api/resumes            [auth]   → List all resumes with scores
GET    /api/resumes/stats      [auth]   → Aggregate stats for dashboard
GET    /api/resumes/:id        [auth]   → Get single resume + analyses
POST   /api/resumes            [auth]   → Create new resume
PATCH  /api/resumes/:id        [auth]   → Update resume
DELETE /api/resumes/:id        [auth]   → Delete resume
```

### ATS Analysis
```
POST /api/ats/analyze          [auth]   → Run AI analysis
  Body: { jobDescription, resumeId? OR resumeText?, jobTitle?, company? }

GET  /api/ats/analyses/:id     [auth]   → Get analysis report by ID
```

### Export
```
POST /api/export/:resumeId/pdf [auth]   → Download optimized PDF
POST /api/export/:resumeId/txt [auth]   → Download plain text
```

---

## Common Issues & Fixes

### `PrismaClientInitializationError`
→ PostgreSQL is not running. Run `brew services start postgresql@16` (macOS) or `sudo systemctl start postgresql` (Linux)

### `Invalid DATABASE_URL`
→ Check your `.env` string matches format: `postgresql://USER:PASS@HOST:PORT/DBNAME`

### `CORS error` in browser
→ Make sure `FRONTEND_URL` in `backend/.env` matches exactly `http://localhost:5173`

### Microsoft OAuth redirect mismatch
→ The redirect URI in Azure Portal **must exactly match**: `http://localhost:4000/api/auth/microsoft/callback`

### OpenAI quota exceeded
→ Switch `OPENAI_MODEL=gpt-4o-mini` in `.env` — it's 10× cheaper and works great for this use case

---

## Next Steps

- [ ] Add resume PDF upload parsing (pdf-parse is already installed)
- [ ] Build the resume section editor (drag & drop bullets)
- [ ] Add Stripe billing for Pro plan
- [ ] Deploy: Vercel (frontend) + Railway (backend + Postgres)
- [ ] Add Redis + BullMQ for async AI job queue
- [ ] Chrome extension for scraping JDs from LinkedIn/Indeed
