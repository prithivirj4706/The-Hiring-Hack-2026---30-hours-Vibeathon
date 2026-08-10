from typing import Literal

from pydantic import BaseModel, Field


class InternshipCreate(BaseModel):
    title: str = Field(min_length=2, max_length=140)
    description: str = Field(min_length=10)
    location: str = "Remote"
    stipend: str = ""
    duration: str = "3 months"
    required_skills: list[str] = []


class InternshipUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    stipend: str | None = None
    duration: str | None = None
    required_skills: list[str] | None = None
    status: Literal["open", "closed"] | None = None


class ApplicationStatusUpdate(BaseModel):
    status: Literal["applied", "shortlisted", "rejected", "hired"]
