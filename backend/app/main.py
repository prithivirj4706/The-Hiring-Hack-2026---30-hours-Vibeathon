from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.postgres import close_engine, init_db, ping
from app.modules.ai_service.router import router as ai_router
from app.modules.analytics.router import router as analytics_router
from app.modules.auth.router import router as auth_router
from app.modules.learning_engine.router import router as learning_router
from app.modules.matching_engine.router import router as matching_router
from app.modules.recruiter.router import router as recruiter_router
from app.modules.student.resume_pdf_router import router as student_resume_pdf_router
from app.modules.student.router import router as student_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    if await ping():
        await init_db()
    else:
        print(f"WARNING: cannot reach PostgreSQL at {settings.database_url} — check DATABASE_URL in .env")
    yield
    await close_engine()


app = FastAPI(title="BPUT Career Platform API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(student_router)
app.include_router(student_resume_pdf_router)
app.include_router(recruiter_router)
app.include_router(matching_router)
app.include_router(analytics_router)
app.include_router(ai_router)
app.include_router(learning_router)


@app.get("/")
async def health():
    return {"status": "ok", "service": "BPUT Career Platform API"}


@app.get("/api/health")
async def detailed_health():
    """Dependency check used by the frontend to warn before a demo goes wrong."""
    db_ok = await ping()

    ollama_ok, model_ready = False, False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
            response.raise_for_status()
            ollama_ok = True
            names = [m.get("name", "") for m in response.json().get("models", [])]
            model_ready = any(n == settings.ollama_model or n.split(":")[0] == settings.ollama_model.split(":")[0] for n in names)
    except Exception:
        pass

    return {
        "status": "ok" if (db_ok and model_ready) else "degraded",
        "database": {"connected": db_ok, "name": "bput_career (PostgreSQL)"},
        "ollama": {
            "reachable": ollama_ok,
            "model": settings.ollama_model,
            "model_ready": model_ready,
        },
    }
