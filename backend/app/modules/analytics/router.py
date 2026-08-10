from fastapi import APIRouter, Depends

from app.core.security import require_role
from app.modules.analytics import service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

admin_only = require_role("admin")


@router.get("/overview")
async def overview(user: dict = Depends(admin_only)):
    return await service.overview()


@router.get("/branches")
async def branches(user: dict = Depends(admin_only)):
    return await service.branch_breakdown()


@router.get("/skills")
async def skills(user: dict = Depends(admin_only)):
    """Compute a fresh skill-gap report (persisted) and return it."""
    return await service.generate_skill_gap_report()


@router.get("/skill-gap-reports/latest")
async def latest_skill_gap_report(user: dict = Depends(admin_only)):
    return await service.latest_skill_gap_report()


@router.get("/skill-gap-reports")
async def skill_gap_reports(user: dict = Depends(admin_only)):
    return await service.list_skill_gap_reports()
