import asyncio
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select

from app.db.models import Application, Internship, Student
from app.db.postgres import get_session
from app.modules.ai_service import service as ai

# Cap concurrent LLM calls so a large applicant pool doesn't overwhelm Ollama.
MAX_CONCURRENT_MATCHES = 3


def _job_description(internship: Internship) -> str:
    skills = ", ".join(internship.required_skills or [])
    return (
        f"Title: {internship.title}\n"
        f"Company: {internship.company}\n"
        f"Location: {internship.location}\n"
        f"Duration: {internship.duration}\n"
        f"Required skills: {skills}\n\n"
        f"{internship.description}"
    )


def _candidate_text(student: Student) -> str:
    return (
        f"Name: {student.name}\n"
        f"Branch: {student.branch} | Year: {student.year} | "
        f"CGPA: {student.cgpa if student.cgpa is not None else 'N/A'}\n"
        f"Skills: {', '.join(student.skills or [])}\n"
        f"Projects: {', '.join(student.projects or [])}\n"
        f"Certifications: {', '.join(student.certifications or [])}\n\n"
        f"{student.resume_text or student.resume_summary or ''}"
    )


async def rank_applicants(recruiter_id: str, internship_id: str) -> list[dict]:
    """Score every applicant against the job description and persist the results."""
    async with get_session() as session:
        internship = await session.get(Internship, internship_id)
        if not internship or internship.recruiter_id != recruiter_id:
            raise HTTPException(status_code=404, detail="Internship not found")

        result = await session.execute(select(Application).where(Application.internship_id == internship_id))
        applications = result.scalars().all()
        if not applications:
            return []

        # Fetch every candidate's profile up front (sequential DB reads — a single
        # AsyncSession can't safely serve concurrent queries from gathered coroutines).
        students_by_user_id: dict[str, Student] = {}
        for application in applications:
            if application.user_id not in students_by_user_id:
                student_result = await session.execute(
                    select(Student).where(Student.user_id == application.user_id)
                )
                students_by_user_id[application.user_id] = student_result.scalar_one_or_none()

        jd = _job_description(internship)
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_MATCHES)

        async def score(application: Application) -> tuple[Application, dict | None, str | None]:
            student = students_by_user_id.get(application.user_id)
            if not student:
                return application, None, None

            async with semaphore:
                try:
                    match = await ai.match_resume_to_job(_candidate_text(student), jd)
                    return application, match, None
                except Exception as exc:  # a single failed candidate must not sink the batch
                    return application, None, str(exc)[:200]

        # Only the AI network calls run concurrently; no DB access inside `score()`.
        scored = await asyncio.gather(*(score(a) for a in applications))

        results = []
        for application, match, match_error in scored:
            data = application.to_dict()
            if match is not None:
                application.match = match
                application.matched_at = datetime.now(timezone.utc)
                data["match"] = match
                data["matched_at"] = application.matched_at
            if match_error:
                data["match_error"] = match_error
            results.append(data)

        await session.commit()

        ranked = sorted(results, key=lambda a: (a.get("match") or {}).get("match_score", -1), reverse=True)
        return ranked


async def preview_match(user_id: str, internship_id: str) -> dict:
    """Let a student see their own AI match score against an internship before applying."""
    async with get_session() as session:
        result = await session.execute(select(Student).where(Student.user_id == user_id))
        student = result.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")

        internship = await session.get(Internship, internship_id)
        if not internship:
            raise HTTPException(status_code=404, detail="Internship not found")

        return await ai.match_resume_to_job(_candidate_text(student), _job_description(internship))
