import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.schemas.analysis import ResumeAnalysisResponse
from app.services.ai_analysis import extract_text_from_file, analyze_resume_text
from typing import List
from app.models.application import Application

router = APIRouter(prefix="/resumes", tags=["resumes"])

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@router.get("/mine", response_model=List[ResumeResponse])
def get_my_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.uploaded_at.desc()).all()
    return resumes


@router.post("/upload", response_model=ResumeResponse)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    safe_filename = f"user_{current_user.id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        filepath=filepath,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.post("/{resume_id}/analyze", response_model=ResumeAnalysisResponse)
def analyze_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_text = extract_text_from_file(resume.filepath)
    result = analyze_resume_text(resume_text)

    resume.score = result.score
    db.commit()

    return result


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    application_count = db.query(Application).filter(
        Application.resume_id == resume_id
    ).count()

    db.query(Application).filter(
        Application.resume_id == resume_id
    ).update({"resume_id": None})

    try:
        if os.path.exists(resume.filepath):
            os.remove(resume.filepath)
    except Exception:
        pass

    db.delete(resume)
    db.commit()

    return {
        "message": "Resume deleted",
        "had_applications": application_count > 0,
        "application_count": application_count,
    }