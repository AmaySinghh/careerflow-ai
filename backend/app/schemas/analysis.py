from pydantic import BaseModel
from typing import List


class ResumeAnalysisResponse(BaseModel):
    score: int
    suggestions: List[str]
    enhanced_text: str
    skills: List[str]