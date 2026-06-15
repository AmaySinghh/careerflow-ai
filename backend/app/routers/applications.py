from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, get_current_recruiter, get_current_candidate
from app.models.application import Application
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User
from app.schemas.application import (
    ApplicationResponse,
    ApplicationWithJobResponse,
    ApplicationWithCandidateResponse,
    StatusUpdate,
)

router = APIRouter(prefix="/applications", tags=["applications"])

VALID_STATUSES = {"Applied", "Shortlisted", "Interview", "Rejected", "Selected"}


def calculate_match_score(candidate_skills: list, required_skills: list) -> int:
    if not required_skills:
        return 0
    candidate_set = {s.lower() for s in candidate_skills}
    required_set = {s.lower() for s in required_skills}
    matched = candidate_set & required_set
    return int(len(matched) / len(required_set) * 100)


def get_missing_and_strengths(candidate_skills: list, required_skills: list):
    candidate_set = {s.lower() for s in candidate_skills}
    required_set = {s.lower() for s in required_skills}
    missing = [s for s in required_skills if s.lower() not in candidate_set]
    strengths = [s for s in candidate_skills if s.lower() in required_set]
    return missing, strengths


def get_candidate_skills(resume: Resume) -> list:
    """
    Get candidate skills from DB first (persists without file).
    Fall back to file extraction only if skills not in DB and file exists.
    """
    if resume and resume.skills:
        return resume.skills

    if resume and resume.filepath:
        from app.services.ai_analysis import extract_text_from_file, analyze_resume_text
        try:
            resume_text = extract_text_from_file(resume.filepath)
            analysis = analyze_resume_text(resume_text)
            return analysis.skills
        except Exception:
            pass

    return []


@router.post("/{job_id}/apply", response_model=ApplicationResponse)
def apply_to_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.source != "internal":
        raise HTTPException(status_code=400, detail="Cannot apply to external jobs through this platform")

    existing = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")

    latest_resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.uploaded_at.desc()).first()

    match_score = None

    if latest_resume:
        candidate_skills = get_candidate_skills(latest_resume)
        if candidate_skills and job.required_skills:
            match_score = calculate_match_score(candidate_skills, job.required_skills)

    # All applications start as Applied — recruiter manually shortlists
    application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        resume_id=latest_resume.id if latest_resume else None,
        status="Applied",
        match_score=match_score,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/mine", response_model=list[ApplicationWithJobResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):
    applications = db.query(Application).filter(
        Application.candidate_id == current_user.id
    ).order_by(Application.applied_at.desc()).all()

    result = []
    for app in applications:
        job = db.query(Job).filter(Job.id == app.job_id).first()

        candidate_skills = []
        if app.resume_id:
            resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
            if resume:
                candidate_skills = get_candidate_skills(resume)

        required_skills = job.required_skills or [] if job else []

        result.append(ApplicationWithJobResponse(
            id=app.id,
            job_id=app.job_id,
            status=app.status,
            match_score=app.match_score,
            assessment_score=app.assessment_score,
            applied_at=app.applied_at,
            job_title=job.title if job else "Unknown",
            job_company=job.company if job else "Unknown",
            job_location=job.location if job else "Unknown",
            job_source=job.source if job else "internal",
            job_required_skills=required_skills,
            candidate_skills=candidate_skills,
            has_assessment_questions=bool(job.interview_questions) if job else False,
        ))
    return result


@router.get("/job/{job_id}", response_model=list[ApplicationWithCandidateResponse])
def get_job_applicants(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not yours")

    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).order_by(Application.match_score.desc().nullslast()).all()

    result = []
    for app in applications:
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        resume_score = None
        resume_skills = []
        missing_skills = []
        strength_skills = []

        if app.resume_id:
            resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
            if resume:
                resume_score = resume.score
                resume_skills = get_candidate_skills(resume)
                if job.required_skills and resume_skills:
                    missing_skills, strength_skills = get_missing_and_strengths(
                        resume_skills, job.required_skills
                    )

        result.append(ApplicationWithCandidateResponse(
            id=app.id,
            candidate_id=app.candidate_id,
            candidate_name=candidate.full_name if candidate else None,
            candidate_email=candidate.email if candidate else "Unknown",
            resume_id=app.resume_id,
            status=app.status,
            match_score=app.match_score,
            assessment_score=app.assessment_score,
            assessment_feedback=app.assessment_feedback,
            applied_at=app.applied_at,
            resume_score=resume_score,
            resume_skills=resume_skills,
            missing_skills=missing_skills,
            strength_skills=strength_skills,
        ))
    return result


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    if status_update.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
        )

    application = db.query(Application).filter(
        Application.id == application_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(
        Job.id == application.job_id,
        Job.recruiter_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")

    application.status = status_update.status
    db.commit()
    db.refresh(application)
    return application


@router.get("/{application_id}/candidate-summary")
def get_candidate_summary(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(
        Job.id == application.job_id,
        Job.recruiter_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=403, detail="Not authorized")

    candidate = db.query(User).filter(User.id == application.candidate_id).first()

    resume_score = None
    resume_skills = []
    if application.resume_id:
        resume = db.query(Resume).filter(Resume.id == application.resume_id).first()
        if resume:
            resume_score = resume.score
            resume_skills = get_candidate_skills(resume)

    from google import genai
    import os

    assessment_info = ""
    if application.assessment_score is not None:
        assessment_info = f"\nScreening Assessment Score: {application.assessment_score}/100"
        if application.assessment_feedback:
            assessment_info += f"\nAssessment Feedback: {application.assessment_feedback}"

    prompt = f"""You are a recruiter assistant. Write a concise 3-4 line candidate summary.

Job: {job.title} at {job.company}
Required Skills: {', '.join(job.required_skills or [])}
Candidate Name: {candidate.full_name or candidate.email}
Resume Score: {resume_score}/100
Candidate Skills: {', '.join(resume_skills)}
Match Score: {application.match_score}%
Application Status: {application.status}{assessment_info}

Write a professional summary highlighting strengths, gaps, and a hiring recommendation. Be direct and concise."""

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    return {"summary": response.text}


@router.get("/{application_id}/interview-questions")
def get_interview_questions_for_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.candidate_id == current_user.id,
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status != "Shortlisted":
        raise HTTPException(
            status_code=403,
            detail="Screening assessment is only available for shortlisted candidates."
        )

    job = db.query(Job).filter(Job.id == application.job_id).first()

    if not job.interview_questions:
        raise HTTPException(
            status_code=404,
            detail="Recruiter has not set up screening questions for this job yet."
        )

    return {"questions": job.interview_questions}


@router.post("/{application_id}/evaluate")
def evaluate_interview(
    application_id: int,
    answers: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.candidate_id == current_user.id,
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id).first()

    from google import genai
    from google.genai import types
    import os
    import json

    answers_text = "\n".join([
        f"Q{i+1}: {q}\nA{i+1}: {a}"
        for i, (q, a) in enumerate(zip(
            answers.get("questions", []),
            answers.get("answers", [])
        ))
    ])

    prompt = f"""You are a technical interviewer evaluating screening assessment answers.

Job: {job.title}
Required Skills: {', '.join(job.required_skills or [])}

Questions and Answers:
{answers_text}

Evaluate and return JSON:
{{
  "technical_accuracy": <integer 0-10>,
  "communication": <integer 0-10>,
  "problem_solving": <integer 0-10>,
  "overall_score": <integer 0-100>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "recommendation": "<Hire / Consider / Reject>"
}}"""

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    result = json.loads(response.text)

    application.assessment_score = result["overall_score"]
    application.assessment_feedback = result["feedback"]
    db.commit()

    return result