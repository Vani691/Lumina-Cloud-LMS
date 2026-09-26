from fastapi import APIRouter, HTTPException
from models import SubmissionBase
from database import supabase
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/submissions",
    tags=["Submissions"]
)

@router.post("/")
def create_submission(submission: SubmissionBase):
    try:
        data = submission.model_dump()
        
        # 1. Fetch the assignment deadline to determine if it is late
        assignment_res = supabase.table("assignments").select("deadline").eq("id", data["assignment_id"]).execute()
        if not assignment_res.data:
            raise HTTPException(status_code=404, detail="Assignment not found")
            
        deadline_str = assignment_res.data[0]["deadline"]
        deadline_date = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        
        # 2. Determine status based on server time
        current_time = datetime.now(deadline_date.tzinfo)
        data["status"] = "LATE" if current_time > deadline_date else "SUBMITTED"
        
        # 3. Insert into database
        response = supabase.table("submissions").insert(data).execute()
        return {"status": "success", "data": response.data}
        
    except Exception as e:
        # Handle the UNIQUE constraint error if they already submitted
        if "duplicate key value" in str(e).lower():
            raise HTTPException(status_code=400, detail="You have already submitted this assignment.")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/student/{student_id}")
def get_student_submissions(student_id: str):
    try:
        response = supabase.table("submissions").select("*").eq("student_id", student_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))    

@router.get("/assignment/{assignment_id}")
def get_assignment_submissions(assignment_id: str):
    try:
        # We use select("*, profiles(full_name, email)") to automatically grab the student's name!
        response = supabase.table("submissions").select("*, profiles(full_name, email)").eq("assignment_id", assignment_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))    

class GradeUpdate(BaseModel):
    marks: int
    feedback: str

@router.put("/{submission_id}/grade")
def grade_submission(submission_id: str, grade: GradeUpdate):
    try:
        data = grade.model_dump()
        data["status"] = "GRADED"
        data["graded_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("submissions").update(data).eq("id", submission_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))    