from fastapi import APIRouter, Depends

from app.core.security import require_role
from app.modules.recruiter import service
from app.modules.recruiter.schemas import ApplicationStatusUpdate, InternshipCreate, InternshipUpdate

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])

recruiter_only = require_role("recruiter")


@router.get("/me")
async def get_me(user: dict = Depends(recruiter_only)):
    return await service.get_profile(user["id"])


@router.get("/internships")
async def list_internships(user: dict = Depends(recruiter_only)):
    return await service.list_internships(user["id"])


@router.post("/internships", status_code=201)
async def create_internship(payload: InternshipCreate, user: dict = Depends(recruiter_only)):
    return await service.create_internship(user["id"], payload)


@router.put("/internships/{internship_id}")
async def update_internship(
    internship_id: str, payload: InternshipUpdate, user: dict = Depends(recruiter_only)
):
    return await service.update_internship(user["id"], internship_id, payload)


@router.delete("/internships/{internship_id}")
async def delete_internship(internship_id: str, user: dict = Depends(recruiter_only)):
    return await service.delete_internship(user["id"], internship_id)


@router.get("/internships/{internship_id}/applications")
async def list_applications(internship_id: str, user: dict = Depends(recruiter_only)):
    return await service.list_applications(user["id"], internship_id)


@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str, payload: ApplicationStatusUpdate, user: dict = Depends(recruiter_only)
):
    return await service.update_application_status(user["id"], application_id, payload.status)
