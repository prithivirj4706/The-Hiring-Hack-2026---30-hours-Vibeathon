import httpx
from fastapi import APIRouter, HTTPException

from app.modules.ai_service import service
from app.modules.ai_service.schemas import MatchRequest, RecommendationRequest, ResumeAnalysisRequest

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _as_http_exception(exc: Exception) -> HTTPException:
    if isinstance(exc, ValueError):
        return HTTPException(status_code=502, detail="LLM did not return valid JSON")
    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 404:
        return HTTPException(
            status_code=503,
            detail="Ollama model not found. Run `ollama pull llama3` and ensure it finished downloading.",
        )
    if isinstance(exc, httpx.ConnectError):
        return HTTPException(status_code=503, detail="Cannot reach Ollama. Is `ollama serve` running?")
    return HTTPException(status_code=502, detail="LLM request failed")


@router.post("/resume-analysis")
async def resume_analysis(payload: ResumeAnalysisRequest):
    try:
        return await service.analyze_resume(payload.resume_text)
    except (ValueError, httpx.HTTPError) as exc:
        raise _as_http_exception(exc)


@router.post("/recommendations")
async def recommendations(payload: RecommendationRequest):
    try:
        return await service.generate_career_recommendations(payload.student_profile)
    except (ValueError, httpx.HTTPError) as exc:
        raise _as_http_exception(exc)


@router.post("/match")
async def match(payload: MatchRequest):
    try:
        return await service.match_resume_to_job(payload.resume_text, payload.job_description)
    except (ValueError, httpx.HTTPError) as exc:
        raise _as_http_exception(exc)
