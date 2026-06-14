import os
import json
import hashlib
import redis
from pypdf import PdfReader
from docx import Document
from google import genai
from google.genai import types
from app.schemas.analysis import ResumeAnalysisResponse

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
redis_client = redis.Redis.from_url(os.environ["REDIS_URL"], decode_responses=True)

ANALYSIS_PROMPT = """You are a resume reviewer for software developer job applications in India.

Given the resume text below, return a JSON object with exactly these fields:
- "score": an integer from 0 to 100 rating the resume's overall quality for software dev roles
- "suggestions": a list of 3 to 6 short, specific, actionable improvement suggestions
- "enhanced_text": an improved version of the resume text with better wording and structure
- "skills": a list of 5 to 10 technical skills extracted from the resume (e.g. "Python", "React", "FastAPI", "SQL", "Docker")

Resume text:
{resume_text}
"""

def extract_text_from_file(filepath: str) -> str:
    if filepath.lower().endswith(".pdf"):
        reader = PdfReader(filepath)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif filepath.lower().endswith(".docx"):
        doc = Document(filepath)
        return "\n".join(p.text for p in doc.paragraphs)
    else:
        raise ValueError(f"Unsupported file type: {filepath}")

def analyze_resume_text(resume_text: str) -> ResumeAnalysisResponse:
    content_hash = hashlib.sha256(resume_text.encode("utf-8")).hexdigest()
    cache_key = f"resume_analysis:{content_hash}"

    cached = redis_client.get(cache_key)
    if cached:
        return ResumeAnalysisResponse(**json.loads(cached))

    prompt = ANALYSIS_PROMPT.format(resume_text=resume_text)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    data = json.loads(response.text)
    result = ResumeAnalysisResponse(**data)

    redis_client.set(cache_key, result.model_dump_json(), ex=60 * 60 * 24 * 7)
    return result