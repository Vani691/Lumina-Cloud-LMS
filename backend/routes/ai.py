from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"]
)

class FeedbackRequest(BaseModel):
    assignment_title: str
    description: str
    marks_given: int
    max_marks: int
    # NEW: Optional notes from the teacher to prevent AI hallucinations
    teacher_notes: str = "" 

@router.post("/generate-feedback")
def generate_feedback(req: FeedbackRequest):
    try:
        notes_context = f"Teacher's specific notes: {req.teacher_notes}" if req.teacher_notes else "Base the feedback strictly on the score."
        
        prompt = f"""
        You are an encouraging, professional teaching assistant.
        Assignment: {req.assignment_title} ({req.description})
        Score: {req.marks_given}/{req.max_marks}
        {notes_context}
        
        Write a concise, 2-3 sentence feedback note. Do not use formatting, hashtags, or robotic greetings. Explain deductions only if the teacher provided notes.
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-20b", 
            temperature=0.5
        )
        
        feedback = chat_completion.choices[0].message.content.strip()
        return {"status": "success", "feedback": feedback}
        
    except Exception as e:
        print(f"GROQ ERROR: {str(e)}") 
        raise HTTPException(status_code=500, detail="Cloud AI generation failed.")