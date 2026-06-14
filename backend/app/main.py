from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, resumes, jobs, applications
from app.database import engine
from sqlalchemy import text
import os

app = FastAPI(
    title="AI Recruitment Platform",
    description="""
## AI-Powered Recruitment Platform

A full-stack recruitment platform that automates the hiring workflow using Google Gemini AI.

### Candidate Features
- Upload and AI-analyze resumes (score, skills, suggestions)
- Browse and apply to jobs with automated shortlisting
- Take AI-generated screening assessments
- Track application status in real time

### Recruiter Features  
- Post and manage job listings
- Auto-ranked applicants by AI match score
- Generate AI screening questions per job
- Review assessment scores and AI candidate summaries

### AI Capabilities
- Resume scoring and skill extraction via Google Gemini
- Job-resume match scoring
- Automated screening question generation
- Interview response evaluation
- Redis caching for AI responses (7-day TTL)
    """,
    version="1.0.0",
    contact={
        "name": "Amay Singh",
        "url": "https://github.com/amaysingh",
    },
    license_info={
        "name": "MIT",
    },
)

# CORS — allow localhost for dev and Railway/production domains
origins = [
    "http://localhost:5173",
    "http://localhost",
    "http://localhost:80",
]

# Allow additional origins from environment variable
# In production set: ALLOWED_ORIGINS=https://your-app.railway.app
extra_origins = os.environ.get("ALLOWED_ORIGINS", "")
if extra_origins:
    origins.extend([o.strip() for o in extra_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(applications.router)


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint.

    Returns service status and database connectivity.
    Used by Railway and other deployment platforms to verify the service is running.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "version": "1.0.0",
    }