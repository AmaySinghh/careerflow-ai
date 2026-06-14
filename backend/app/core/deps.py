from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.database import get_db
from app.core.config import settings
from app.core.security import oauth2_scheme
from app.models.user import User


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_recruiter(current_user: User = Depends(get_current_user)):
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Recruiter access required")
    return current_user


def get_current_candidate(current_user: User = Depends(get_current_user)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Candidate access required")
    return current_user