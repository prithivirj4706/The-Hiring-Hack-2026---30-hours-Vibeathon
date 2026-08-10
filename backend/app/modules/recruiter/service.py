from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select

from app.db.models import Application, Internship, Recruiter
from app.db.postgres import get_session
from app.modules.recruiter.schemas import InternshipCreate, InternshipUpdate


async def _recruiter_doc(session, user_id: str) -> Recruiter:
    result = await session.execute(select(Recruiter).where(Recruiter.user_id == user_id))
    recruiter = result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    return recruiter


async def get_profile(user_id: str) -> dict:
    async with get_session() as session:
        recruiter = await _recruiter_doc(session, user_id)
        return recruiter.to_dict()


async def create_internship(user_id: str, payload: InternshipCreate) -> dict:
    async with get_session() as session:
        recruiter = await _recruiter_doc(session, user_id)
        internship = Internship(
            **payload.model_dump(),
            recruiter_id=user_id,
            company=recruiter.company,
            status="open",
        )
        session.add(internship)
        await session.commit()
        await session.refresh(internship)
        return internship.to_dict()


async def list_internships(user_id: str) -> list[dict]:
    async with get_session() as session:
        result = await session.execute(
            select(Internship).where(Internship.recruiter_id == user_id).order_by(Internship.created_at.desc())
        )
        internships = result.scalars().all()

        # Attach the application count so the recruiter dashboard can show it directly.
        rows = []
        for internship in internships:
            count_result = await session.execute(
                select(func.count()).select_from(Application).where(Application.internship_id == internship.id)
            )
            data = internship.to_dict()
            data["application_count"] = count_result.scalar_one()
            rows.append(data)
        return rows


async def update_internship(user_id: str, internship_id: str, payload: InternshipUpdate) -> dict:
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    async with get_session() as session:
        internship = await _assert_owns(session, user_id, internship_id)
        for field, value in updates.items():
            setattr(internship, field, value)
        internship.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(internship)
        return internship.to_dict()


async def delete_internship(user_id: str, internship_id: str) -> dict:
    async with get_session() as session:
        internship = await _assert_owns(session, user_id, internship_id)
        await session.execute(
            Application.__table__.delete().where(Application.internship_id == internship_id)
        )
        await session.delete(internship)
        await session.commit()
        return {"deleted": True, "id": internship_id}


async def list_applications(user_id: str, internship_id: str) -> list[dict]:
    async with get_session() as session:
        await _assert_owns(session, user_id, internship_id)
        result = await session.execute(select(Application).where(Application.internship_id == internship_id))
        applications = [a.to_dict() for a in result.scalars().all()]
        # Highest AI match score first; un-scored applications sink to the bottom.
        applications.sort(key=lambda a: (a.get("match") or {}).get("match_score", -1), reverse=True)
        return applications


async def update_application_status(user_id: str, application_id: str, status: str) -> dict:
    async with get_session() as session:
        application = await session.get(Application, application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        await _assert_owns(session, user_id, application.internship_id)

        application.status = status
        application.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(application)
        return application.to_dict()


async def _assert_owns(session, user_id: str, internship_id: str) -> Internship:
    internship = await session.get(Internship, internship_id)
    if not internship or internship.recruiter_id != user_id:
        raise HTTPException(status_code=404, detail="Internship not found")
    return internship
