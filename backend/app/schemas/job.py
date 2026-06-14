from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: str
    required_skills: Optional[List[str]] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None


class JobResponse(BaseModel):
    id: int
    title: str
    company: str
    location: str
    salary_min: Optional[int]
    salary_max: Optional[int]
    description: str
    source_url: Optional[str]
    source: str
    recruiter_id: Optional[int]
    required_skills: Optional[List[str]]
    interview_questions: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int
    applicant_counts: Optional[dict] = {}
    shortlisted_counts: Optional[dict] = {}