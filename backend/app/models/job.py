from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False, index=True)
    location = Column(String, nullable=False)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    source_url = Column(String, nullable=True)
    source_id = Column(String, nullable=True, unique=True)
    source = Column(String, nullable=False, server_default="external")
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    required_skills = Column(JSON, nullable=True)
    interview_questions = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())