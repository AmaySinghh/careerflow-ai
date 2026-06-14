from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ResumeResponse(BaseModel):
    id: int
    filename: str
    score: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True