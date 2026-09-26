import { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, Loader2, ChevronRight, Calendar, Plus, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]); // NEW: Store courses
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filter, setFilter] = useState('ALL'); // Status filter
  const [selectedCourse, setSelectedCourse] = useState('ALL'); // Course filter
  
  // Join Class State
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const [assignRes, subRes, courseRes] = await Promise.all([
        api.getAllAssignments(),
        api.getStudentSubmissions(user.id),
        api.getStudentCourses(user.id)
      ]);
      
      setEnrolledCourses(courseRes.data);
      
      const enrolledCourseIds = courseRes.data.map(c => c.id);
      const enrolledAssignments = assignRes.data.filter(a => enrolledCourseIds.includes(a.course_id));
      
      setAssignments(enrolledAssignments);
      setSubmissions(subRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) return;
    setJoining(true);
    try {
      await api.joinCourse({ class_code: classCode.toUpperCase(), student_id: user.id });
      await loadData();
      alert("Successfully enrolled in the class!");
      setIsJoinModalOpen(false);
      setClassCode('');
    } catch (error) {
      alert(error.message || "Failed to join class. Verify the code.");
    } finally {
      setJoining(false);
    }
  };

  const getAssignmentStatus = (assignmentId) => {
    const submission = submissions.find(sub => sub.assignment_id === assignmentId);
    if (!submission) return 'PENDING';
    if (submission.status === 'GRADED') return 'GRADED';
    return 'SUBMITTED';
  };

  // Calculate stats based ONLY on the currently selected course
  const activeAssignments = selectedCourse === 'ALL' 
    ? assignments 
    : assignments.filter(a => a.course_id === selectedCourse);

  const pendingCount = activeAssignments.filter(a => getAssignmentStatus(a.id) === 'PENDING').length;
  const submittedCount = activeAssignments.filter(a => getAssignmentStatus(a.id) === 'SUBMITTED').length;
  const gradedCount = activeAssignments.filter(a => getAssignmentStatus(a.id) === 'GRADED').length;

  // Double filter: matches BOTH the status filter and the course filter
  const filteredAssignments = activeAssignments.filter(a => {
    if (filter === 'ALL') return true;
    return getAssignmentStatus(a.id) === filter;
  });

  return (
    <div className="space-y-8 relative">
      
      {/* NEW: My Classes Grid */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/30 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">My Classes</h2>
            {selectedCourse !== 'ALL' && (
              <button onClick={() => setSelectedCourse('ALL')} className="text-sm bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors font-bold">
                View All Courses
              </button>
            )}
          </div>
          <button onClick={() => setIsJoinModalOpen(true)} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors">
            <Plus size={18} className="mr-2" /> Join Class
          </button>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white" size={32} /></div>
        ) : enrolledCourses.length === 0 ? (
           <div className="text-center p-8 text-white/80 bg-white/5 rounded-xl border border-white/10">You haven't joined any classes yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map(course => (
              <div 
                key={course.id} 
                onClick={() => {
                  setSelectedCourse(course.id);
                  setFilter('ALL'); // Reset status filter when switching courses
                }}
                className={`p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer ${selectedCourse === course.id ? 'bg-gradient-to-br from-pink-500 to-orange-400 ring-4 ring-white/50' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                  <BookOpen size={64} />
                </div>
                <h3 className="text-xl font-bold mb-1 relative z-10">{course.course_name}</h3>
                <p className="text-white/80 text-sm relative z-10 font-medium">Code: {course.class_code}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/30 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">
              {selectedCourse === 'ALL' ? 'Overall Coursework' : 'Course Progress'}
            </h2>
            {filter !== 'ALL' && (
              <button onClick={() => setFilter('ALL')} className="text-sm bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors font-bold">
                Clear Filter
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onClick={() => setFilter('PENDING')} className={`bg-gradient-to-br from-white via-indigo-50 to-purple-50 bg-[length:200%_200%] animate-gradient border-2 p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-1 hover:shadow-lg ${filter === 'PENDING' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-4 ring-blue-500/20' : 'border-white/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-950">Pending</h3>
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Clock size={24} /></div>
            </div>
            <div className="text-5xl font-black text-indigo-900 tracking-tight">
              {loading ? <Loader2 className="animate-spin text-blue-400" size={48} /> : pendingCount}
            </div>
          </div>
          <div onClick={() => setFilter('SUBMITTED')} className={`bg-gradient-to-br from-white via-indigo-50 to-purple-50 bg-[length:200%_200%] animate-gradient border-2 p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-1 hover:shadow-lg ${filter === 'SUBMITTED' ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] ring-4 ring-green-500/20' : 'border-white/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-950">Submitted</h3>
              <div className="p-2 bg-green-100 rounded-lg text-green-600"><FileText size={24} /></div>
            </div>
            <div className="text-5xl font-black text-indigo-900 tracking-tight">
              {loading ? <Loader2 className="animate-spin text-green-400" size={48} /> : submittedCount}
            </div>
          </div>
          <div onClick={() => setFilter('GRADED')} className={`bg-gradient-to-br from-white via-indigo-50 to-purple-50 bg-[length:200%_200%] animate-gradient border-2 p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-1 hover:shadow-lg ${filter === 'GRADED' ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-4 ring-purple-500/20' : 'border-white/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-950">Graded</h3>
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><CheckCircle size={24} /></div>
            </div>
            <div className="text-5xl font-black text-indigo-900 tracking-tight">
              {loading ? <Loader2 className="animate-spin text-purple-400" size={48} /> : gradedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Feed */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/30 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-sm">
          {filter === 'ALL' ? 'Assignments' : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Assignments`}
        </h2>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white" size={32} /></div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center p-8 text-white/80 bg-white/5 rounded-xl border border-white/10">No assignments match this view. 🎉</div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const status = getAssignmentStatus(assignment.id);
              return (
                <div key={assignment.id} onClick={() => navigate(`/assignment/${assignment.id}`)} className="bg-white hover:bg-indigo-50 border border-white/50 p-5 rounded-2xl transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                        {assignment.courses?.course_name || "General"}
                      </span>
                      <span className="flex items-center text-sm text-gray-500 font-medium">
                        <Calendar size={14} className="mr-1" /> Due: {new Date(assignment.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {assignment.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-gray-900">{assignment.max_marks} pts</p>
                      {status === 'PENDING' && <p className="text-xs text-orange-500 font-bold">Pending</p>}
                      {status === 'SUBMITTED' && <p className="text-xs text-green-500 font-bold">Submitted</p>}
                      {status === 'GRADED' && <p className="text-xs text-purple-500 font-bold">Graded</p>}
                    </div>
                    <div className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors shadow-sm">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Join Class Modal Overlay */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setIsJoinModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Class</h2>
            <p className="text-gray-500 mb-6">Ask your instructor for the 6-character class code.</p>
            <form onSubmit={handleJoinClass}>
              <input 
                type="text" 
                maxLength={6}
                required
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-4 text-center text-2xl tracking-widest uppercase font-bold text-indigo-900 focus:border-indigo-500 focus:ring-0 outline-none mb-6 placeholder:text-gray-300"
                placeholder="XXXXXX" 
              />
              <button type="submit" disabled={joining || classCode.length < 6} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center">
                {joining ? <Loader2 className="animate-spin" size={24} /> : "Enroll Now"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}