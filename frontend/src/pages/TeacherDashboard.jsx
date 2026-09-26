import { useEffect, useState } from 'react';
import { Users, FileArchive, Loader2, PlusCircle, ChevronRight, Calendar, UploadCloud, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('ALL'); 
  const [referenceFile, setReferenceFile] = useState(null); 

  const [formData, setFormData] = useState({
    title: '', description: '', deadline: '', max_marks: 100, course_id: ''
  });

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const coursesRes = await api.getTeacherCourses(user.id);
      setCourses(coursesRes.data);
      
      const teacherCourseIds = coursesRes.data.map(c => c.id);
      const assignmentsRes = await api.getAllAssignments();
      
      const teacherAssignments = assignmentsRes.data.filter(a => teacherCourseIds.includes(a.course_id));
      teacherAssignments.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      
      setAssignments(teacherAssignments);
      if (coursesRes.data.length > 0 && !formData.course_id) {
        setFormData(prev => ({ ...prev, course_id: coursesRes.data[0].id }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const isPastDue = (deadline) => new Date() > new Date(deadline);
  const activeCount = assignments.filter(a => !isPastDue(a.deadline)).length;
  const needsGradingCount = assignments.filter(a => isPastDue(a.deadline)).length;

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return !isPastDue(a.deadline);
    if (filter === 'NEEDS_GRADING') return isPastDue(a.deadline);
    return true;
  });

  // NEW: Quick course creation
  const handleCreateCourse = async () => {
    const courseName = window.prompt("Enter new course name (e.g., Data Structures):");
    if (!courseName) return;
    try {
      await api.createCourse({ course_name: courseName, teacher_id: user.id });
      await loadData();
      alert(`Course "${courseName}" created successfully! Check the dropdown for the join code.`);
    } catch (error) {
      alert("Failed to create course.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let reference_file_url = null;
      if (referenceFile) {
        const fileExt = referenceFile.name.split('.').pop();
        const filePath = `references/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('assignments').upload(filePath, referenceFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('assignments').getPublicUrl(filePath);
        reference_file_url = publicUrlData.publicUrl;
      }

      const formattedData = {
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
        reference_file_url
      };
      
      await api.createAssignment(formattedData);
      await loadData();
      setFormData({ ...formData, title: '', description: '' }); 
      setReferenceFile(null);
      alert("Assignment Created Successfully!");
    } catch (error) {
      alert("Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/30 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white drop-shadow-sm">Instructor Overview</h2>
          {filter !== 'ALL' && (
            <button onClick={() => setFilter('ALL')} className="text-sm bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors font-bold">
              Show All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => setFilter('ACTIVE')} className={`bg-gradient-to-br from-white via-indigo-50 to-purple-50 bg-[length:200%_200%] animate-gradient border-2 p-6 rounded-2xl cursor-pointer flex flex-col justify-between group hover:shadow-lg transition-all hover:-translate-y-1 ${filter === 'ACTIVE' ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] ring-4 ring-indigo-500/20' : 'border-white/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-950">Active Assignments</h3>
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FileArchive size={24} /></div>
            </div>
            <div className="text-5xl font-black text-indigo-900 tracking-tight">
              {loading ? <Loader2 className="animate-spin text-indigo-400" size={48} /> : activeCount}
            </div>
          </div>
          
          <div onClick={() => setFilter('NEEDS_GRADING')} className={`bg-gradient-to-br from-white via-indigo-50 to-purple-50 bg-[length:200%_200%] animate-gradient border-2 p-6 rounded-2xl cursor-pointer flex flex-col justify-between group hover:shadow-lg transition-all hover:-translate-y-1 ${filter === 'NEEDS_GRADING' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] ring-4 ring-orange-500/20' : 'border-white/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-950">Past Due (Needs Grading)</h3>
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Users size={24} /></div>
            </div>
            <div className="text-5xl font-black text-indigo-900 tracking-tight">
              {loading ? <Loader2 className="animate-spin text-orange-400" size={48} /> : needsGradingCount}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/50 shadow-xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><PlusCircle size={24} /></div>
            <h2 className="text-2xl font-bold text-gray-900">Create New</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Assignment Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">Course</label>
                  <button type="button" onClick={handleCreateCourse} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center">
                    <Plus size={12} className="mr-1" /> Add Course
                  </button>
                </div>
                <select required value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_name} {course.class_code ? `(Code: ${course.class_code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Reference File (Optional)</label>
              <label className="border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-indigo-50 rounded-xl p-4 flex items-center justify-center cursor-pointer transition-colors">
                <UploadCloud size={20} className="text-indigo-500 mr-2" />
                <span className="text-sm text-gray-600">{referenceFile ? referenceFile.name : "Attach a template (PDF, ZIP)"}</span>
                <input type="file" className="hidden" onChange={(e) => setReferenceFile(e.target.files[0])} />
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Deadline</label>
                <input type="datetime-local" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Max Marks</label>
                <input type="number" required min="1" max="100" value={formData.max_marks} onChange={e => setFormData({...formData, max_marks: parseInt(e.target.value)})} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-md mt-4 disabled:opacity-50">
              {submitting ? "Publishing..." : "Publish Assignment"}
            </button>
          </form>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/30 shadow-xl h-fit">
          <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-sm">
            {filter === 'ALL' ? 'Manage Assignments' : `${filter === 'ACTIVE' ? 'Active' : 'Past Due'} Assignments`}
          </h2>
          
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white" size={32} /></div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center p-8 text-white/80 bg-white/5 rounded-xl border border-white/10">No assignments found for this filter.</div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredAssignments.map((assignment) => {
                const pastDue = isPastDue(assignment.deadline);
                const course = courses.find(c => c.id === assignment.course_id);
                return (
                  <div key={assignment.id} onClick={() => navigate(`/grade/${assignment.id}`)} className="bg-white hover:bg-indigo-50 border border-white/50 p-5 rounded-2xl transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                          {course?.course_name || "Course"} {course?.class_code && `(Code: ${course.class_code})`}
                        </span>
                        <span className={`text-xs font-bold ${pastDue ? 'text-orange-500' : 'text-green-500'}`}>
                          {pastDue ? 'Past Due' : 'Active'}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {assignment.title}
                      </h3>
                      <span className="flex items-center text-sm text-gray-500 font-medium mt-1">
                          <Calendar size={14} className="mr-1" /> Due: {new Date(assignment.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
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
      </div>
    </div>
  );
}