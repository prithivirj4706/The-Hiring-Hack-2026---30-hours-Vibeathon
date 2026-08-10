from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["student", "recruiter", "admin"]


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Role = "student"
    # Student-only fields
    branch: str | None = None
    year: int | None = None
    # Recruiter-only field
    company: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    is_verified: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
