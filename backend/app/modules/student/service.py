from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.db.models import Application, Internship, Recommendation, Student
from app.db.postgres import get_session
from app.modules.ai_service import service as ai
from app.modules.student.schemas import StudentProfileUpdate


async def _get_student(session, user_id: str) -> Student:
    result = await session.execute(select(Student).where(Student.user_id == user_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


async def get_profile(user_id: str) -> dict:
    async with get_session() as session:
        student = await _get_student(session, user_id)
        return student.to_dict()


def _clean_str(val):
    if isinstance(val, str):
        return val.replace("\x00", "")
    if isinstance(val, list):
        return [_clean_str(x) for x in val if x is not None]
    return val


async def update_profile(user_id: str, payload: StudentProfileUpdate) -> dict:
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}

    async with get_session() as session:
        student = await _get_student(session, user_id)
        if updates:
            for field, value in updates.items():
                setattr(student, field, _clean_str(value))
            student.updated_at = datetime.now(timezone.utc)
            await session.commit()
            await session.refresh(student)
        return student.to_dict()


async def analyze_and_store_resume(user_id: str, resume_text: str) -> dict:
    """Run the resume through the LLM and merge the extracted data into the profile."""
    resume_text = _clean_str(resume_text)
    analysis = await ai.analyze_resume(resume_text)

    async with get_session() as session:
        student = await _get_student(session, user_id)

        student.resume_text = resume_text
        student.readiness_score = analysis.get("readiness_score")
        student.resume_summary = _clean_str(analysis.get("summary", ""))
        student.experience_years = analysis.get("experience_years", 0)
        student.last_analyzed_at = datetime.now(timezone.utc)

        # Merge AI-extracted lists into whatever the student already entered.
        for field in ("skills", "projects", "certifications"):
            extracted = _clean_str(analysis.get(field) or [])
            if extracted:
                existing = getattr(student, field) or []
                merged = list(dict.fromkeys([*existing, *extracted]))
                setattr(student, field, merged)

        await session.commit()
        await session.refresh(student)
        return {"analysis": analysis, "profile": student.to_dict()}


async def generate_recommendations(user_id: str) -> dict:
    """Ask the LLM for career paths / skill gaps based on the stored profile."""
    async with get_session() as session:
        student = await _get_student(session, user_id)

        profile = {
            "branch": student.branch,
            "year": student.year,
            "cgpa": student.cgpa,
            "skills": student.skills or [],
            "projects": student.projects or [],
            "certifications": student.certifications or [],
            "interests": student.interests or [],
            "resume_summary": student.resume_summary or "",
        }
        if not any([profile["skills"], profile["projects"], profile["resume_summary"]]):
            raise HTTPException(
                status_code=400,
                detail="Add skills or upload a resume before generating recommendations.",
            )

        result = await ai.generate_career_recommendations(profile)

        session.add(
            Recommendation(
                user_id=user_id,
                recommended_paths=result.get("recommended_paths", []),
                skill_gaps=result.get("skill_gaps", []),
                learning_roadmap=result.get("learning_roadmap", []),
                rationale=result.get("rationale", ""),
            )
        )
        await session.commit()
        return result


async def latest_recommendation(user_id: str) -> dict | None:
    async with get_session() as session:
        result = await session.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user_id)
            .order_by(Recommendation.created_at.desc())
            .limit(1)
        )
        rec = result.scalar_one_or_none()
        return rec.to_dict() if rec else None


async def list_internships() -> list[dict]:
    async with get_session() as session:
        result = await session.execute(
            select(Internship).where(Internship.status == "open").order_by(Internship.created_at.desc())
        )
        return [i.to_dict() for i in result.scalars().all()]


async def apply_to_internship(user_id: str, internship_id: str) -> dict:
    async with get_session() as session:
        student = await _get_student(session, user_id)

        internship = await session.get(Internship, internship_id)
        if not internship:
            raise HTTPException(status_code=404, detail="Internship not found")

        application = Application(
            internship_id=internship_id,
            internship_title=internship.title,
            company=internship.company,
            student_name=student.name,
            user_id=user_id,
            status="applied",
        )
        session.add(application)
        try:
            await session.commit()
        except IntegrityError:
            raise HTTPException(status_code=409, detail="You have already applied to this internship")

        await session.refresh(application)
        return application.to_dict()


async def my_applications(user_id: str) -> list[dict]:
    async with get_session() as session:
        result = await session.execute(
            select(Application).where(Application.user_id == user_id).order_by(Application.created_at.desc())
        )
        return [a.to_dict() for a in result.scalars().all()]
