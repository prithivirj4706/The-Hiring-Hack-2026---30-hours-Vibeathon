from pydantic import BaseModel


class ResumeAnalysisRequest(BaseModel):
    resume_text: str


class RecommendationRequest(BaseModel):
    student_profile: dict


class MatchRequest(BaseModel):
    resume_text: str
    job_description: str
