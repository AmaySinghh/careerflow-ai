from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    resume_id: Optional[int]
    status: str
    match_score: Optional[int]
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationWithJobResponse(BaseModel):
    id: int
    job_id: int
    status: str
    match_score: Optional[int]
    assessment_score: Optional[int] = None
    applied_at: datetime
    job_title: str
    job_company: str
    job_location: str
    job_source: str
    job_required_skills: Optional[List[str]] = []
    candidate_skills: Optional[List[str]] = []
    has_assessment_questions: Optional[bool] = False

    class Config:
        from_attributes = True


class ApplicationWithCandidateResponse(BaseModel):
    id: int
    candidate_id: int
    candidate_name: Optional[str]
    candidate_email: str
    resume_id: Optional[int]
    status: str
    match_score: Optional[int]
    assessment_score: Optional[int] = None
    assessment_feedback: Optional[str] = None
    applied_at: datetime
    resume_score: Optional[int]
    resume_skills: Optional[List[str]]
    missing_skills: Optional[List[str]] = []
    strength_skills: Optional[List[str]] = []

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str