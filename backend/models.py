from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourseBase(BaseModel):
    course_name: str
    teacher_id: str

class AssignmentBase(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    deadline: datetime
    max_marks: int
    reference_file_url: Optional[str] = None  # NEW: Allow teachers to upload a file

class SubmissionBase(BaseModel):
    assignment_id: str
    student_id: str
    file_name: str
    file_url: str
    storage_path: str

# NEW: Model for grading
class GradeUpdate(BaseModel):
    marks: int
    feedback: str

class EnrollmentBase(BaseModel):
    class_code: str
    student_id: str    