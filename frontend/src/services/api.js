const API_URL = "http://127.0.0.1:8000/api";

export const api = {
  getAllAssignments: async () => {
    const response = await fetch(`${API_URL}/assignments/`);
    if (!response.ok) throw new Error("Network response error");
    return response.json();
  },
  getTeacherCourses: async (teacherId) => {
    const response = await fetch(`${API_URL}/courses/teacher/${teacherId}`);
    if (!response.ok) throw new Error("Network response error");
    return response.json();
  },
  // NEW: Create an assignment
  createAssignment: async (assignmentData) => {
    const response = await fetch(`${API_URL}/assignments/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignmentData),
    });
    if (!response.ok) throw new Error("Failed to create assignment");
    return response.json();
  },
  // NEW: Get a single assignment by ID
  getAssignmentById: async (id) => {
    const response = await fetch(`${API_URL}/assignments/${id}`);
    if (!response.ok) throw new Error("Failed to fetch assignment details");
    return response.json();
  },

  // Fetch submissions for a specific student
  getStudentSubmissions: async (studentId) => {
    const response = await fetch(`${API_URL}/submissions/student/${studentId}`);
    if (!response.ok) throw new Error("Failed to fetch submissions");
    return response.json();
  },

  // Fetch all submissions for a specific assignment (for teachers)
  getAssignmentSubmissions: async (assignmentId) => {
    const response = await fetch(`${API_URL}/submissions/assignment/${assignmentId}`);
    if (!response.ok) throw new Error("Failed to fetch submissions");
    return response.json();
  },

  // NEW: Submit assignment metadata
  submitAssignment: async (submissionData) => {
    const response = await fetch(`${API_URL}/submissions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to save submission");
    }
    return response.json();
  },

  // Submit a grade and feedback for a submission
  gradeSubmission: async (submissionId, gradeData) => {
    const response = await fetch(`${API_URL}/submissions/${submissionId}/grade`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gradeData),
    });
    if (!response.ok) throw new Error("Failed to submit grade");
    return response.json();
  },

  // NEW: Create a course from the frontend
  createCourse: async (courseData) => {
    const response = await fetch(`${API_URL}/courses/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData),
    });
    if (!response.ok) throw new Error("Failed to create course");
    return response.json();
  },
  
  // NEW: Get courses a student is enrolled in
  getStudentCourses: async (studentId) => {
    const response = await fetch(`${API_URL}/courses/student/${studentId}`);
    if (!response.ok) throw new Error("Failed to fetch enrolled courses");
    return response.json();
  },

  // NEW: Join a course using a code
  joinCourse: async (enrollmentData) => {
    const response = await fetch(`${API_URL}/courses/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrollmentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to join course");
    }
    return response.json();
  },

  // Generate AI feedback for a grade
  generateAIFeedback: async (feedbackData) => {
    const response = await fetch(`${API_URL}/ai/generate-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedbackData),
    });
    if (!response.ok) throw new Error("Failed to generate AI feedback");
    return response.json();
  }
};