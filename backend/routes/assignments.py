from fastapi import APIRouter, HTTPException
from models import AssignmentBase
from database import supabase

router = APIRouter(
    prefix="/api/assignments",
    tags=["Assignments"]
)

@router.post("/")
def create_assignment(assignment: AssignmentBase):
    try:
        # Convert Pydantic model to dictionary and format datetime for PostgreSQL
        data = assignment.model_dump()
        data['deadline'] = data['deadline'].isoformat()
        
        # Insert into Supabase
        response = supabase.table("assignments").insert(data).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
def get_all_assignments():
    try:
        # Fetch all assignments, joining with the courses table to get the course name
        response = supabase.table("assignments").select("*, courses(course_name)").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/course/{course_id}")
def get_assignments_by_course(course_id: str):
    try:
        response = supabase.table("assignments").select("*").eq("course_id", course_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{assignment_id}")
def get_assignment(assignment_id: str):
    try:
        response = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))    