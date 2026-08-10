from fastapi import APIRouter, Depends

from app.core.security import require_role
from app.modules.student import service
from app.modules.student.schemas import ApplyRequest, ResumeUpload, StudentProfileUpdate

router = APIRouter(prefix="/api/student", tags=["student"])

student_only = require_role("student")


@router.get("/me")
async def get_me(user: dict = Depends(student_only)):
    return await service.get_profile(user["id"])


@router.put("/me")
async def update_me(payload: StudentProfileUpdate, user: dict = Depends(student_only)):
    return await service.update_profile(user["id"], payload)


@router.post("/me/resume")
async def upload_resume(payload: ResumeUpload, user: dict = Depends(student_only)):
    return await service.analyze_and_store_resume(user["id"], payload.resume_text)


@router.post("/me/recommendations")
async def create_recommendations(user: dict = Depends(student_only)):
    return await service.generate_recommendations(user["id"])


@router.get("/me/recommendations")
async def get_recommendations(user: dict = Depends(student_only)):
    return await service.latest_recommendation(user["id"])


@router.get("/internships")
async def browse_internships(user: dict = Depends(student_only)):
    return await service.list_internships()


@router.post("/applications")
async def apply(payload: ApplyRequest, user: dict = Depends(student_only)):
    return await service.apply_to_internship(user["id"], payload.internship_id)


@router.get("/applications")
async def list_my_applications(user: dict = Depends(student_only)):
    return await service.my_applications(user["id"])
