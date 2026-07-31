# BPUT Career Platform

AI-powered career recommendation and internship matching platform connecting BPUT students, placement cells, and recruiters. See [`docs/problem-statement.md`](docs/problem-statement.md) for the full problem statement.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB Atlas
- **AI**: Gemini API
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

### Frontend

```
cd frontend
npm install
npm run dev
```

### Backend

```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in secrets
uvicorn app.main:app --reload
```

## Branching

- `main` — stable/deployable
- `dev` — active integration branch

## Roadmap

Development is paced against the hackathon milestone matrix in [`docs/evaluation-milestones.md`](docs/evaluation-milestones.md).
