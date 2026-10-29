import httpx
from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.modules.ai_service import service
from app.modules.ai_service.client import LLMError
from app.modules.ai_service.schemas import MatchRequest, RecommendationRequest, ResumeAnalysisRequest

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _as_http_exception(exc: Exception) -> HTTPException:
    """Turn an upstream failure into a message that names the real cause.

    The provider matters here: a 404 from Ollama means the model was never
    pulled, while a 404 from Groq means the account cannot serve that model id
    (Groq moved the Llama ids to enterprise plans in August 2026). Reporting the
    wrong one sends you debugging the wrong machine.
    """
    provider = settings.llm_provider.lower()
    is_groq = provider == "groq"

    if isinstance(exc, LLMError):
        return HTTPException(status_code=503, detail=str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(status_code=502, detail="LLM did not return valid JSON")

    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        if status in (401, 403):
            return HTTPException(
                status_code=503,
                detail=(
                    "Groq rejected the API key. Check GROQ_API_KEY."
                    if is_groq
                    else "The LLM provider rejected the request credentials."
                ),
            )
        if status == 404:
            if is_groq:
                return HTTPException(
                    status_code=503,
                    detail=(
                        f"Groq has no model '{settings.groq_model}' available on this account. "
                        "List what you can call with GET https://api.groq.com/openai/v1/models "
                        "and set GROQ_MODEL to one of those ids."
                    ),
                )
            return HTTPException(
                status_code=503,
                detail=f"Ollama has no model '{settings.ollama_model}'. Run `ollama pull {settings.ollama_model}`.",
            )
        if status == 429:
            return HTTPException(status_code=503, detail="LLM provider rate limit reached. Try again shortly.")

    if isinstance(exc, httpx.ConnectError):
        return HTTPException(
            status_code=503,
            detail=(
                "Cannot reach Groq." if is_groq else "Cannot reach Ollama. Is `ollama serve` running?"
            ),
        )
    return HTTPException(status_code=502, detail="LLM request failed")


@router.post("/resume-analysis")
async def resume_analysis(payload: ResumeAnalysisRequest):
    try:
        return await service.analyze_resume(payload.resume_text)
    except (ValueError, LLMError, httpx.HTTPError) as exc:
        raise _as_http_exception(exc)


@router.post("/recommendations")
async def recommendations(payload: RecommendationRequest):
    try:
        return await service.generate_career_recommendations(payload.student_profile)
    except (ValueError, LLMError, httpx.HTTPError) as exc:
        raise _as_http_exception(exc)


@router.post("/match")
async def match(payload: MatchRequest):
    try:
        return await service.match_resume_to_job(payload.resume_text, payload.job_description)
    except (ValueError, LLMError, httpx.HTTPError) as exc:
        raise _as_http_exception(exc)
