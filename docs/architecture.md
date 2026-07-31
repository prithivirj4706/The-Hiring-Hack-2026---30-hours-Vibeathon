# System Architecture

## Users

- Student
- Recruiter
- Placement Officer (Admin)

## Stack

- **Frontend**: React + Tailwind (Student / Recruiter / Admin UI), communicating via REST (Axios/Fetch)
- **Backend**: FastAPI
- **Database**: MongoDB Atlas
- **External Services**: Gemini API, Cloudinary (resume storage), Render (backend hosting), Vercel (frontend hosting)

## Backend Modules

- **Authentication Module** — JWT login, role management
- **Student Module** — profile, resume upload, skills, projects, certifications
- **Recruiter Module** — company profile, internship CRUD, applications
- **Recommendation Engine** — career prediction, skill gap analysis, learning roadmap
- **Internship Matching Engine** — resume ↔ JD matching, candidate ranking, match score
- **Analytics Module** — placement statistics, department reports, skill insights
- **AI Service Layer** — Gemini API integration, prompt engineering, resume analysis, recommendation generation

## Database Collections

- Users
- Students
- Recruiters
- Internships
- Applications
- Recommendations
- Analytics

## Diagram

```
USERS
 ┌────────────────────┬────────────────────┬────────────────────┐
 │      Student       │     Recruiter      │ Placement Officer  │
 │                    │                    │       (Admin)       │
 └─────────┬──────────┴─────────┬──────────┴─────────┬──────────┘
           └────────────────────┼────────────────────┘
                                ▼
                    React + Tailwind Frontend
               (Student / Recruiter / Admin UI)
                                │
                     REST API (Axios / Fetch)
                                ▼
                        FastAPI Backend Server
 ├── Authentication Module
 ├── Student Module
 ├── Recruiter Module
 ├── Recommendation Engine
 ├── Internship Matching Engine
 ├── Analytics Module
 └── AI Service Layer
                                │
                     MongoDB Atlas Database
 ├── Users, Students, Recruiters, Internships
 └── Applications, Recommendations, Analytics
                                │
                     External Cloud Services
 ├── Gemini API
 ├── Cloudinary (Resume Storage)
 ├── Render (Backend)
 └── Vercel (Frontend)
```

## ERD

_To be drafted — see Phase 1 milestone (Hours 0–4) in the evaluation protocol._
