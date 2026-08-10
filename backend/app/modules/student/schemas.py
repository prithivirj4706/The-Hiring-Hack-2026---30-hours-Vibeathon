from pydantic import BaseModel, Field


class StudentProfileUpdate(BaseModel):
    name: str | None = None
    branch: str | None = None
    year: int | None = Field(default=None, ge=1, le=5)
    skills: list[str] | None = None
    projects: list[str] | None = None
    certifications: list[str] | None = None
    interests: list[str] | None = None
    cgpa: float | None = Field(default=None, ge=0, le=10)


class ResumeUpload(BaseModel):
    resume_text: str = Field(min_length=20)


class ApplyRequest(BaseModel):
    internship_id: str
