from fastapi import APIRouter, Depends

from app.core.security import require_role
from app.modules.matching_engine import service

router = APIRouter(prefix="/api/matching", tags=["matching"])


@router.post("/internships/{internship_id}/rank")
async def rank_applicants(internship_id: str, user: dict = Depends(require_role("recruiter"))):
    return await service.rank_applicants(user["id"], internship_id)


@router.post("/internships/{internship_id}/preview")
async def preview_match(internship_id: str, user: dict = Depends(require_role("student"))):
    return await service.preview_match(user["id"], internship_id)
