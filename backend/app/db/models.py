"""SQLAlchemy models — one table per MongoDB collection the app used to have.

List-y fields (skills, projects, required_skills, etc.) are kept as JSONB columns
rather than normalized into separate tables, so the shape of data flowing in and
out of each row matches the old MongoDB documents as closely as possible and the
service-layer logic above this file needed the smallest possible rewrite.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def _new_id() -> str:
    return uuid.uuid4().hex


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    # Null for accounts created through Google/GitHub, which have no local password.
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False)
    oauth_provider: Mapped[str | None] = mapped_column(String, nullable=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    verification_code_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_verified": self.is_verified,
            "oauth_provider": self.oauth_provider,
            "created_at": self.created_at,
        }


class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    branch: Mapped[str] = mapped_column(String, default="")
    year: Mapped[int] = mapped_column(Integer, default=1)
    cgpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    skills: Mapped[list] = mapped_column(JSONB, default=list)
    projects: Mapped[list] = mapped_column(JSONB, default=list)
    certifications: Mapped[list] = mapped_column(JSONB, default=list)
    interests: Mapped[list] = mapped_column(JSONB, default=list)
    resume_text: Mapped[str] = mapped_column(Text, default="")
    resume_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    readiness_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_analyzed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "branch": self.branch,
            "year": self.year,
            "cgpa": self.cgpa,
            "skills": self.skills or [],
            "projects": self.projects or [],
            "certifications": self.certifications or [],
            "interests": self.interests or [],
            "resume_text": self.resume_text or "",
            "resume_summary": self.resume_summary,
            "experience_years": self.experience_years,
            "readiness_score": self.readiness_score,
            "last_analyzed_at": self.last_analyzed_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class Recruiter(Base):
    __tablename__ = "recruiters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "company": self.company,
            "created_at": self.created_at,
        }


class Internship(Base):
    __tablename__ = "internships"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    recruiter_id: Mapped[str] = mapped_column(String, nullable=False, index=True)  # recruiter's user_id
    company: Mapped[str] = mapped_column(String, default="")
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String, default="Remote")
    stipend: Mapped[str] = mapped_column(String, default="")
    duration: Mapped[str] = mapped_column(String, default="3 months")
    required_skills: Mapped[list] = mapped_column(JSONB, default=list)
    status: Mapped[str] = mapped_column(String, default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "recruiter_id": self.recruiter_id,
            "company": self.company,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "stipend": self.stipend,
            "duration": self.duration,
            "required_skills": self.required_skills or [],
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("internship_id", "user_id", name="uq_application_internship_user"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    internship_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    internship_title: Mapped[str] = mapped_column(String, default="")
    company: Mapped[str] = mapped_column(String, default="")
    student_name: Mapped[str] = mapped_column(String, default="")
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, default="applied")
    match: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    match_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    matched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "internship_id": self.internship_id,
            "internship_title": self.internship_title,
            "company": self.company,
            "student_name": self.student_name,
            "user_id": self.user_id,
            "status": self.status,
            "match": self.match,
            "match_error": self.match_error,
            "matched_at": self.matched_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    recommended_paths: Mapped[list] = mapped_column(JSONB, default=list)
    skill_gaps: Mapped[list] = mapped_column(JSONB, default=list)
    learning_roadmap: Mapped[list] = mapped_column(JSONB, default=list)
    rationale: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "recommended_paths": self.recommended_paths or [],
            "skill_gaps": self.skill_gaps or [],
            "learning_roadmap": self.learning_roadmap or [],
            "rationale": self.rationale or "",
            "created_at": self.created_at,
        }


class SkillGapReport(Base):
    __tablename__ = "skill_gap_reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    top_student_skills: Mapped[list] = mapped_column(JSONB, default=list)
    top_demanded_skills: Mapped[list] = mapped_column(JSONB, default=list)
    skill_gaps: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, index=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "top_student_skills": self.top_student_skills or [],
            "top_demanded_skills": self.top_demanded_skills or [],
            "skill_gaps": self.skill_gaps or [],
            "created_at": self.created_at,
        }


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    skill_category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    difficulty: Mapped[str] = mapped_column(String, default="Beginner")
    duration: Mapped[str] = mapped_column(String, default="4 hours")
    lessons: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "skill_category": self.skill_category,
            "difficulty": self.difficulty,
            "duration": self.duration,
            "lessons": self.lessons or [],
            "created_at": self.created_at,
        }


class StudentCourseEnrollment(Base):
    __tablename__ = "student_course_enrollments"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_user_course"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    course_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    completed_lessons: Mapped[list] = mapped_column(JSONB, default=list)
    status: Mapped[str] = mapped_column(String, default="enrolled")
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "progress_percent": self.progress_percent,
            "completed_lessons": self.completed_lessons or [],
            "status": self.status,
            "updated_at": self.updated_at,
        }


class DailyMockTest(Base):
    __tablename__ = "daily_mock_tests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    date: Mapped[str] = mapped_column(String, nullable=False, index=True)
    skill_category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    questions: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "date": self.date,
            "skill_category": self.skill_category,
            "title": self.title,
            "questions": self.questions or [],
            "created_at": self.created_at,
        }


class MockTestSubmission(Base):
    __tablename__ = "mock_test_submissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    test_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    score_percent: Mapped[int] = mapped_column(Integer, default=0)
    answers: Mapped[dict] = mapped_column(JSONB, default=dict)
    passed: Mapped[bool] = mapped_column(default=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "test_id": self.test_id,
            "score_percent": self.score_percent,
            "answers": self.answers or {},
            "passed": self.passed,
            "completed_at": self.completed_at,
        }


class StudentSkillProgress(Base):
    __tablename__ = "student_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_name", name="uq_user_skill"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    skill_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="available")  # locked, recommended, in_progress, mastered
    xp_points: Mapped[int] = mapped_column(Integer, default=0)
    mastered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "skill_name": self.skill_name,
            "status": self.status,
            "xp_points": self.xp_points,
            "mastered_at": self.mastered_at,
        }
