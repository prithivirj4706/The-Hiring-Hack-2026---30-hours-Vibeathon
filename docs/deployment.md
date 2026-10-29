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
2. Copy the connection string. It looks like:
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/bput_career?sslmode=require`
3. **Rewrite it for asyncpg** — this app uses the async driver, and the default
   string will not work:
   - change `postgresql://` to `postgresql+asyncpg://`
   - delete `?sslmode=require` (asyncpg rejects that parameter; it uses SSL anyway)

   Final form:
   ```
   postgresql+asyncpg://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/bput_career
   ```
4. Keep this string — it becomes `DATABASE_URL` on Render.

Tables create themselves on first boot (`init_db()` runs at startup), so there is
no migration step.

---

## 2. AI — Groq

1. Go to https://console.groq.com/keys and create an API key (starts with `gsk_`).
2. Keep it — it becomes `GROQ_API_KEY` on Render.

The free tier covers `llama-3.3-70b-versatile`, which is what `GROQ_MODEL`
defaults to. Local development still uses Ollama; only the deployed backend
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
   | `DATABASE_URL` | the rewritten Neon string from part 1 |
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
DATABASE_URL='postgresql+asyncpg://...neon...' ./venv/bin/python seed.py
```

Add `--ai` to run real resume analysis during the seed (slower; needs a working
LLM provider). Every seeded account uses the password `demo1234`.

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
| `InvalidCatalogNameError` on boot | Neon string still has `?sslmode=require` or `postgresql://` | Rewrite per part 1 |
| Social button missing | That provider's ID/secret pair is unset | Add both to Render, redeploy |
| `redirect_uri_mismatch` | Registered URI differs from `BACKEND_BASE_URL` | Make them byte-identical, no trailing slash |
| CORS error in the browser console | `CORS_ORIGINS` missing the Vercel URL | Add it, redeploy backend |
| AI calls fail with 401 | `GROQ_API_KEY` wrong or `LLM_PROVIDER` still `ollama` | Fix both on Render |
| First request takes ~50s | Render free tier cold start | Warm it before the demo |
