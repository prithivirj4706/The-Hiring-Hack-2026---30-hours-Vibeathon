from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_role
from app.modules.learning_engine import service
from app.modules.learning_engine.schemas import MockTestSubmissionSchema, ProgressUpdateSchema

router = APIRouter(prefix="/api/learning", tags=["learning"])

student_only = require_role("student")


@router.get("/courses")
async def get_courses():
    return await service.list_courses()


@router.get("/enrollments")
async def get_enrollments(user: dict = Depends(student_only)):
    return await service.get_user_enrollments(user["id"])


@router.post("/courses/{course_id}/enroll")
async def enroll_course(course_id: str, user: dict = Depends(student_only)):
    return await service.enroll_course(user["id"], course_id)


@router.put("/courses/{course_id}/progress")
async def update_progress(course_id: str, payload: ProgressUpdateSchema, user: dict = Depends(student_only)):
    return await service.update_course_progress(user["id"], course_id, payload.lesson_id)


@router.get("/mock-tests/daily")
async def get_daily_tests():
    return await service.get_daily_mock_tests()


@router.post("/mock-tests/{test_id}/submit")
async def submit_mock_test(test_id: str, payload: MockTestSubmissionSchema, user: dict = Depends(student_only)):
    return await service.submit_mock_test(user["id"], test_id, payload.answers)


@router.get("/skill-tree")
async def get_skill_tree(user: dict = Depends(student_only)):
    return await service.get_skill_tree(user["id"])


@router.get("/program-tracker")
async def get_program_tracker(user: dict = Depends(student_only)):
    return await service.get_program_tracker(user["id"])
