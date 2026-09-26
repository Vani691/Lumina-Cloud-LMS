from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import assignments, courses
from routes import assignments, courses, submissions, ai

app = FastAPI(
    title="Lumina API",
    description="Backend for the Cloud-Based Student Assignment Portal",
    version="1.0.0"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the routes
app.include_router(courses.router)
app.include_router(assignments.router)
app.include_router(submissions.router)
app.include_router(ai.router)
@app.get("/")
def read_root():
    return {"status": "success", "message": "Lumina API is running perfectly! 🚀"}