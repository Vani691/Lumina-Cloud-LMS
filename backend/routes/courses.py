from fastapi import APIRouter, HTTPException
from models import CourseBase, EnrollmentBase
from database import supabase
import random
import string

router = APIRouter(
    prefix="/api/courses",
    tags=["Courses"]
)

@router.post("/")
def create_course(course: CourseBase):
    try:
        data = course.model_dump()
        
        # Generate a 6-character random uppercase alphanumeric code (e.g., "X7B9WQ")
        data['class_code'] = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        response = supabase.table("courses").insert(data).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
def get_all_courses():
    try:
        response = supabase.table("courses").select("*").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/teacher/{teacher_id}")
def get_courses_by_teacher(teacher_id: str):
    try:
        response = supabase.table("courses").select("*").eq("teacher_id", teacher_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# NEW: Endpoint for students to join a course using the 6-character code
@router.post("/join")
def join_course(enrollment: EnrollmentBase):
    try:
        # 1. Verify the class code exists
        course_res = supabase.table("courses").select("id").eq("class_code", enrollment.class_code).execute()
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Invalid class code. Please check and try again.")
            
        course_id = course_res.data[0]["id"]
        
        # 2. Enroll the student
        enroll_data = {
            "student_id": enrollment.student_id,
            "course_id": course_id
        }
        
        response = supabase.table("enrollments").insert(enroll_data).execute()
        return {"status": "success", "message": "Successfully joined the course!"}
        
    except Exception as e:
        # Catch the UNIQUE constraint violation if they try to join twice
        if "duplicate key value" in str(e).lower():
            raise HTTPException(status_code=400, detail="You are already enrolled in this class.")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/student/{student_id}")
def get_courses_by_student(student_id: str):
    try:
        # Fetch enrollments for the student and join the related course data
        response = supabase.table("enrollments").select("course_id, courses(*)").eq("student_id", student_id).execute()
        
        # Flatten the nested response so it returns a clean list of course objects
        courses = [item["courses"] for item in response.data if item.get("courses")]
        return {"status": "success", "data": courses}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))    