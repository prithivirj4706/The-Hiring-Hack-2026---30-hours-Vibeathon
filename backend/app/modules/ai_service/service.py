import json
import re

from app.modules.ai_service.client import llm_client
from app.modules.ai_service.prompts import (
    CAREER_RECOMMENDATION_SYSTEM_PROMPT,
    MATCHING_SYSTEM_PROMPT,
    RESUME_ANALYSIS_SYSTEM_PROMPT,
)

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)
_TRAILING_COMMA_RE = re.compile(r",\s*([\]}])")


def _parse_json(raw: str) -> dict:
    """Parse LLM output into a dict, tolerating code fences, trailing commas, and surrounding prose."""
    text = _FENCE_RE.sub("", raw or "").strip()
    text = _TRAILING_COMMA_RE.sub(r"\1", text)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            snippet = _TRAILING_COMMA_RE.sub(r"\1", text[start : end + 1])
            try:
                parsed = json.loads(snippet)
            except Exception:
                parsed = {}
        else:
            parsed = {}

    if not isinstance(parsed, dict):
        return {}
    return parsed


def _as_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str) and value.strip():
        return [part.strip() for part in value.split(",") if part.strip()]
    return []


def _as_score(value) -> int:
    """Coerce a model-provided score into a 0-100 integer."""
    try:
        score = float(value)
    except (TypeError, ValueError):
        return 0
    if 0 < score <= 1:  # some models answer with a 0-1 fraction
        score *= 100
    return max(0, min(100, round(score)))


async def analyze_resume(resume_text: str) -> dict:
    raw = await llm_client.generate(
        f"Resume:\n{resume_text}",
        system=RESUME_ANALYSIS_SYSTEM_PROMPT,
        format_json=True,
    )
    data = _parse_json(raw)
    return {
        "skills": _as_list(data.get("skills")),
        "projects": _as_list(data.get("projects")),
        "certifications": _as_list(data.get("certifications")),
        "experience_years": data.get("experience_years") or 0,
        "readiness_score": _as_score(data.get("readiness_score")),
        "summary": str(data.get("summary") or ""),
    }


async def generate_career_recommendations(student_profile: dict) -> dict:
    raw = await llm_client.generate(
        f"Student profile:\n{json.dumps(student_profile, default=str)}",
        system=CAREER_RECOMMENDATION_SYSTEM_PROMPT,
        format_json=True,
    )
    data = _parse_json(raw)
    return {
        "recommended_paths": _as_list(data.get("recommended_paths")),
        "skill_gaps": _as_list(data.get("skill_gaps")),
        "learning_roadmap": _as_list(data.get("learning_roadmap")),
        "rationale": str(data.get("rationale") or ""),
    }


async def match_resume_to_job(resume_text: str, job_description: str) -> dict:
    raw = await llm_client.generate(
        f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}",
        system=MATCHING_SYSTEM_PROMPT,
        format_json=True,
    )
    data = _parse_json(raw)
    return {
        "match_score": _as_score(data.get("match_score")),
        "matching_skills": _as_list(data.get("matching_skills")),
        "missing_skills": _as_list(data.get("missing_skills")),
        "rationale": str(data.get("rationale") or ""),
    }
