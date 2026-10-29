# BPUT Career Platform

AI-powered career recommendation and internship matching platform connecting BPUT students, placement cells, and recruiters. See [`docs/problem-statement.md`](docs/problem-statement.md) for the full problem statement.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB Atlas
- **AI**: Llama 3 — Ollama locally, Groq (`llama-3.3-70b-versatile`) in deployment
- **Auth**: JWT + OAuth 2.0 (Google, GitHub)
- **File Storage**: Cloudinary
- **Deployment**: Vercel (frontend), Render (backend)

Full architecture and module breakdown: [`docs/architecture.md`](docs/architecture.md).

## Repo Structure

```
bput-career-platform/
├── frontend/           # React + Tailwind app (Vite)
│   └── src/
│       ├── pages/{student,recruiter,admin}/
│       ├── components/
│       ├── layouts/
│       ├── services/    # API client layer
│       ├── context/     # auth/role context
│       ├── hooks/
│       └── utils/
├── backend/             # FastAPI app
│   └── app/
│       ├── core/        # config, security
│       ├── db/          # MongoDB connection
│       └── modules/
│           ├── auth/
│           ├── student/
│           ├── recruiter/
│           ├── recommendation_engine/
│           ├── matching_engine/
│           ├── analytics/
│           └── ai_service/
└── docs/                # problem statement, architecture, milestone tracking
```

## Local Setup

Requires: Node 18+, Python 3.11+, a local `mongod` (or an Atlas URI), and Ollama.

### 1. AI Service (Ollama) — start this first, the model pull takes a few minutes

```
ollama pull llama3.2:3b
ollama serve   # exposes http://localhost:11434 by default
```

`llama3.2:3b` is the default in `.env.example` — a good balance of quality/speed for a laptop.
Swap in `llama3` (8B) if you have the RAM/GPU for it; update `OLLAMA_MODEL` accordingly.

### 2. Backend

```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# generate a real secret: python -c "import secrets; print(secrets.token_urlsafe(48))"
# paste it into JWT_SECRET in .env
uvicorn app.main:app --reload
```

Seed demo accounts + internships (password for every seeded account is `demo1234`):

```
python seed.py --ai   # --ai runs real resume analysis through Ollama; omit to skip and seed instantly
```

Check `GET http://localhost:8000/api/health` — it reports whether MongoDB and the Ollama model
are actually reachable, which is the fastest way to debug a "nothing works" demo.

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, then sign in with a seeded account (e.g. `ananya@bput.ac.in` /
`demo1234` for the student portal, `kavita@technova.com` for a recruiter, `admin@bput.ac.in` for
the placement officer analytics dashboard) or use the one-click demo login buttons on the sign-in
page.

## Deployment

Full walkthrough: [`docs/deployment.md`](docs/deployment.md) — Neon (Postgres) → Render (API) →
Vercel (frontend), with Groq serving the LLM.

The AI layer switches provider by env var, so no code changes between environments:

| Environment | `LLM_PROVIDER` | Model |
| --- | --- | --- |
| Local | `ollama` | `llama3.2:3b` on your machine |
| Deployed | `groq` | `llama-3.3-70b-versatile` |

Render cannot reach the Ollama on your laptop, so a `localhost` default in production would fail
the milestone's "Pure Localhost Dependency" check — hence the Groq path.

### OAuth 2.0

Google and GitHub sign-in are wired up. Register these callback URLs with each provider:

```
{BACKEND_BASE_URL}/api/auth/oauth/google/callback
{BACKEND_BASE_URL}/api/auth/oauth/github/callback
```

Set the matching `*_CLIENT_ID` / `*_CLIENT_SECRET` pairs in `backend/.env`. A provider with no
credentials simply doesn't render its button — the sign-in page asks
`/api/auth/oauth/providers` on load.

## Branching

- `main` — stable/deployable
- `dev` — active integration branch

## Roadmap

Development is paced against the hackathon milestone matrix in [`docs/evaluation-milestones.md`](docs/evaluation-milestones.md).
