# Vibethon 2026 — 30-Hour Milestone Matrix

Reference: internal evaluation protocol. Used to pace development against judging checkpoints.

| Time Block   | Milestone Target              | Expected Deliverables & Proofs                                                                                   | Weight |
| ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| Hours 0–4    | Architecture & Git Setup        | Problem statement spec, ERD drafted, main/dev branch setup, working local boilerplates.                                  | 10%    |
| Hours 5–10   | Authentication & Page 1         | Secure login/logout via backend validation, hashed passwords stored, responsive landing workspace online.                | 15%    |
| Hours 11–16  | OAuth 2.0 & Security Gate       | Google/GitHub social login integration, secure JWT/session middleware.                                                    | 15%    |
| Hours 17–23  | Core CRUD & AI Engine           | Primary operating view (Page 2), full CRUD pipeline, real-time context-linked dynamic AI operations.                     | 30%    |
| Hours 24–27  | DevOps & Cloud Deployment       | Production build, hidden env config, public HTTPS URL with functional endpoints.                                          | 20%    |
| Hours 28–30  | Demo & Project Pitch            | Functional deployment presentation, system validation under judge QA.                                                     | 10%    |

## Disqualification / Penalty Clauses

- **Mocked AI Behavior (-20 pts)** — hardcoded/static text simulating AI instead of real dynamic API calls.
- **Pure Localhost Dependency (-15 pts)** — codebase can't run outside the dev machine (hardcoded absolute paths, missing config docs).
- **Wholesale Plagiarism (Disqualification)** — repo copied from an existing public repo with no genuine commits during the sprint.

## Implication for setup

- Keep all secrets in `.env` (never committed) — see `backend/.env.example`.
- No hardcoded absolute file paths anywhere in the codebase.
- AI Service Layer must call the real Gemini API, not static/mocked responses.
