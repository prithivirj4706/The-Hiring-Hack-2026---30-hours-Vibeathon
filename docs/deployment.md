# Deployment Guide

Target stack: **Neon** (Postgres) → **Render** (FastAPI) → **Vercel** (React), with
**Groq** serving the LLM. Everything here has a free tier.

Work through the parts in order — Render needs the database URL, and Vercel needs
the Render URL.

---

## 0. Before you start

Collect these four accounts (all free, all sign-in-with-GitHub):

| Service | Used for | URL |
| --- | --- | --- |
| Neon | Postgres database | https://neon.tech |
| Render | FastAPI backend | https://render.com |
| Vercel | React frontend | https://vercel.com |
| Groq | Llama 3.3 inference | https://console.groq.com |

---

## 1. Database — Neon

1. Create a project; name the database `bput_career`.
2. Copy the connection string from the dashboard. Neon hands you something like:
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/bput_career?sslmode=require&channel_binding=require`
3. **Paste it as-is** into `DATABASE_URL`. The app normalises it on startup
   (see `_normalise_url` in [`backend/app/db/postgres.py`](../backend/app/db/postgres.py)):
   it rewrites the scheme to `postgresql+asyncpg://` and moves `sslmode` /
   `channel_binding` into asyncpg's connect args, because asyncpg rejects both
   as query parameters. A plain `postgres://` URL works too.

Tables create themselves on first boot (`init_db()` runs at startup), so there is
no migration step.

---

## 2. AI — Groq

1. Go to https://console.groq.com/keys and create an API key (starts with `gsk_`).
2. Keep it — it becomes `GROQ_API_KEY` on Render.

`GROQ_MODEL` defaults to `openai/gpt-oss-120b`, the strongest model on Groq's
free tier. Note that Groq **retired the Llama ids from the free and Developer
tiers in August 2026** — `llama-3.3-70b-versatile` now 404s unless you are on an
enterprise plan, which is the most likely cause of a failing AI call.

To see what a key can actually serve, deploy and read `/api/health`: when the
configured model is unavailable the response lists the ids that are. Local
development still runs Llama 3.2 through Ollama; only the deployed backend
switches, via `LLM_PROVIDER=groq`.

---

## 3. Backend — Render

1. **New → Web Service**, connect this GitHub repo.
2. Render reads [`render.yaml`](../render.yaml) and fills in the build and start
   commands. If you create the service manually instead:
   - Root directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/api/health`
3. Set the environment variables marked `sync: false`:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon string from part 1, pasted as-is |
   | `GROQ_API_KEY` | the `gsk_...` key from part 2 |
   | `LLM_PROVIDER` | `groq` |
   | `JWT_SECRET` | let Render generate it |
   | `BACKEND_BASE_URL` | your Render URL, e.g. `https://bput-career-api.onrender.com` |
   | `FRONTEND_BASE_URL` | your Vercel URL (fill in after part 4) |
   | `CORS_ORIGINS` | same Vercel URL |

4. Deploy, then open `https://<your-render-url>/api/health`. You want:

   ```json
   {"status":"ok","database":{"connected":true},"ai":{"provider":"groq","model_ready":true}}
   ```

   If `status` is `degraded`, the body tells you which half is wrong.

> **Free-tier note:** Render sleeps an idle free service, so the first request
> after a quiet spell takes ~50 seconds. Open the health URL a few minutes before
> judging to wake it.

---

## 4. Frontend — Vercel

1. **Add New → Project**, import the same repo.
2. Set **Root Directory** to `frontend`. Vercel detects Vite from
   [`vercel.json`](../frontend/vercel.json).
3. Add one environment variable:

   | Key | Value |
   | --- | --- |
   | `VITE_API_BASE_URL` | your Render URL, no trailing slash |

4. Deploy. Copy the resulting `https://....vercel.app` URL back into Render's
   `FRONTEND_BASE_URL` and `CORS_ORIGINS`, then redeploy the backend.

---

## 5. OAuth 2.0

Both providers need the **exact** callback URL. Substitute your Render URL.

### Google

1. https://console.cloud.google.com → create a project.
2. **APIs & Services → OAuth consent screen**: choose *External*, fill in the app
   name and your email, and add yourself under **Test users**. Publishing is not
   required while it is in testing.
3. **Credentials → Create credentials → OAuth client ID → Web application**.
4. **Authorized redirect URIs** — add both:
   ```
   https://<your-render-url>/api/auth/oauth/google/callback
   http://127.0.0.1:8000/api/auth/oauth/google/callback
   ```
5. Copy the client ID and secret into Render as `GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET`.

### GitHub

1. https://github.com/settings/developers → **New OAuth App**.
2. Homepage URL: your Vercel URL.
3. Authorization callback URL:
   ```
   https://<your-render-url>/api/auth/oauth/github/callback
   ```
   (GitHub allows only one, so register a second app for local testing if needed.)
4. Generate a client secret; copy both into Render as `GITHUB_CLIENT_ID` /
   `GITHUB_CLIENT_SECRET`.

Redeploy the backend. The sign-in page asks `/api/auth/oauth/providers` on load
and renders only the buttons whose credentials are present — so if a button is
missing, that provider's pair is unset.

---

## 6. Seeding demo data

The deployed database starts empty. From your laptop, pointed at Neon:

```bash
cd backend
DATABASE_URL='<your Neon connection string>' ./venv/bin/python seed.py
```

Add `--ai` to run real resume analysis during the seed (slower; needs a working
LLM provider). The script prints the seeded accounts and their password when it
finishes — treat that password as a credential and change it before the site is
left open to the public.

---

## 6a. Live URLs

| Piece | URL |
| --- | --- |
| Frontend (Vercel) | https://the-hiring-hack-2026-30-hours-vibea.vercel.app |
| API (Render) | https://bput-career-api.onrender.com |
| Health check | https://bput-career-api.onrender.com/api/health |

Vercel enables **Deployment Protection** on new projects, which puts the site
behind a Vercel login. Turn it off under Settings → Deployment Protection or the
public URL requirement is not met.

---

## 7. Post-deploy checklist

- [ ] `GET /api/health` returns `"status":"ok"`
- [ ] Vercel URL loads the landing page
- [ ] Email/password sign-in works against the deployed API
- [ ] Google button completes the round-trip and lands on the dashboard
- [ ] GitHub button does the same
- [ ] An AI action (Generate recommendations) returns live Groq output
- [ ] No `localhost` left in any deployed environment variable

That last item is the milestone matrix's "Pure Localhost Dependency" check.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `InvalidCatalogNameError` on boot | Database name in the URL does not exist on that branch | Create it in the Neon console, or point at `neondb` |
| Social button missing | That provider's ID/secret pair is unset | Add both to Render, redeploy |
| `redirect_uri_mismatch` | Registered URI differs from `BACKEND_BASE_URL` | Make them byte-identical, no trailing slash |
| CORS error in the browser console | `CORS_ORIGINS` missing the Vercel URL | Add it, redeploy backend |
| AI calls fail with 401 | `GROQ_API_KEY` wrong or `LLM_PROVIDER` still `ollama` | Fix both on Render |
| First request takes ~50s | Render free tier cold start | Warm it before the demo |
