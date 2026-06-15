from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.routers.auth import get_db
from app.core.deps import get_current_recruiter
from app.models.job import Job
from app.models.application import Application
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobListResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=JobListResponse)
def get_jobs(
    search: str = Query(default="", description="Search by title, company, or description"),
    location: str = Query(default="", description="Filter by location"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(Job)

    if search:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.company.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
            )
        )

    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))

    total = query.count()
    jobs = query.offset((page - 1) * page_size).limit(page_size).all()

    job_ids = [j.id for j in jobs]
    counts = dict(
        db.query(Application.job_id, func.count(Application.id))
        .filter(Application.job_id.in_(job_ids))
        .group_by(Application.job_id)
        .all()
    ) if job_ids else {}

    return JobListResponse(
        jobs=jobs,
        total=total,
        page=page,
        page_size=page_size,
        applicant_counts=counts,
    )


@router.post("", response_model=JobResponse)
def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    new_job = Job(
        title=job.title,
        company=job.company,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        description=job.description,
        required_skills=job.required_skills,
        source="internal",
        recruiter_id=current_user.id,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@router.get("/mine", response_model=JobListResponse)
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()

    job_ids = [j.id for j in jobs]

    counts = dict(
        db.query(Application.job_id, func.count(Application.id))
        .filter(Application.job_id.in_(job_ids))
        .group_by(Application.job_id)
        .all()
    ) if job_ids else {}

    shortlisted_counts = dict(
        db.query(Application.job_id, func.count(Application.id))
        .filter(
            Application.job_id.in_(job_ids),
            Application.status == "Shortlisted"
        )
        .group_by(Application.job_id)
        .all()
    ) if job_ids else {}

    return JobListResponse(
        jobs=jobs,
        total=len(jobs),
        page=1,
        page_size=len(jobs) or 10,
        applicant_counts=counts,
        shortlisted_counts=shortlisted_counts,
    )


@router.get("/recruiter/stats")
def get_recruiter_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    total_jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).count()

    job_ids = [
        j.id for j in db.query(Job.id).filter(Job.recruiter_id == current_user.id).all()
    ]

    total_applicants = 0
    shortlisted = 0
    interviews = 0
    rejected = 0
    selected = 0
    pending = 0

    if job_ids:
        total_applicants = db.query(Application).filter(
            Application.job_id.in_(job_ids)
        ).count()

        shortlisted = db.query(Application).filter(
            Application.job_id.in_(job_ids),
            Application.status == "Shortlisted"
        ).count()

        interviews = db.query(Application).filter(
            Application.job_id.in_(job_ids),
            Application.status == "Interview"
        ).count()

        rejected = db.query(Application).filter(
            Application.job_id.in_(job_ids),
            Application.status == "Rejected"
        ).count()

        selected = db.query(Application).filter(
            Application.job_id.in_(job_ids),
            Application.status == "Selected"
        ).count()

        pending = db.query(Application).filter(
            Application.job_id.in_(job_ids),
            Application.status == "Applied"
        ).count()

    return {
        "total_jobs": total_jobs,
        "total_applicants": total_applicants,
        "shortlisted": shortlisted,
        "interviews": interviews,
        "rejected": rejected,
        "selected": selected,
        "pending": pending,
    }


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_update: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == current_user.id,
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for field, value in job_update.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == current_user.id,
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Delete all applications for this job first
    db.query(Application).filter(Application.job_id == job_id).delete()

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}


@router.get("/{job_id}/interview-questions")
def generate_interview_questions(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.interview_questions:
        return {"questions": job.interview_questions}

    from google import genai
    from google.genai import types
    import os
    import json

    prompt = f"""You are a technical interviewer. Generate 5 screening assessment questions for this role.

Job Title: {job.title}
Company: {job.company}
Required Skills: {', '.join(job.required_skills or [])}
Job Description: {job.description}

Generate exactly 5 questions:
- 2 technical questions specific to required skills
- 1 coding/problem-solving question
- 1 behavioral question
- 1 situational/role-specific question

Return as JSON:
{{
  "questions": [
    {{"type": "Technical", "question": "..."}},
    {{"type": "Technical", "question": "..."}},
    {{"type": "Problem Solving", "question": "..."}},
    {{"type": "Behavioral", "question": "..."}},
    {{"type": "Situational", "question": "..."}}
  ]
}}"""

    from google.genai.errors import ClientError

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
    except ClientError as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(
                status_code=429,
                detail="AI quota exceeded. Please try again tomorrow or upgrade your Gemini plan."
            )
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    data = json.loads(response.text)

   
    job.interview_questions = data["questions"]
    db.commit()

    return {"questions": job.interview_questions}