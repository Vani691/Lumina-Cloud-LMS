import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, FileText, X, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function GradingPortal() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [draftGrades, setDraftGrades] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // State for AI Generation loading
  const [generatingAI, setGeneratingAI] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, subRes] = await Promise.all([
          api.getAssignmentById(id),
          api.getAssignmentSubmissions(id)
        ]);
        
        setAssignment(assignRes.data[0]);
        setSubmissions(subRes.data);
        
        const initialDrafts = {};
        subRes.data.forEach(sub => {
          initialDrafts[sub.id] = {
            marks: sub.marks || '',
            feedback: sub.feedback || '',
            teacherNotes: '' // NEW: Track the teacher's rough notes for the AI
          };
        });
        setDraftGrades(initialDrafts);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleGradeUpdate = (submissionId, field, value) => {
    setDraftGrades(prev => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], [field]: value }
    }));
  };

  // NEW: Call the Groq AI API with the optional teacher notes
  const handleAIFeedback = async (submissionId) => {
    const marks = draftGrades[submissionId]?.marks;
    if (!marks) return alert("Please enter the marks first so the AI knows how they did!");
    
    setGeneratingAI(submissionId);
    try {
      const res = await api.generateAIFeedback({
        assignment_title: assignment.title,
        description: assignment.description,
        marks_given: parseInt(marks),
        max_marks: assignment.max_marks,
        teacher_notes: draftGrades[submissionId]?.teacherNotes || "" // Pass notes to backend
      });
      
      // Instantly inject the generated response into the Final Feedback box
      handleGradeUpdate(submissionId, 'feedback', res.feedback);
    } catch (error) {
      alert("AI Generation failed. Check your API key and backend logs.");
    } finally {
      setGeneratingAI(null);
    }
  };

  const submitGrade = async (submissionId) => {
    setProcessingId(submissionId);
    try {
      const data = draftGrades[submissionId];
      await api.gradeSubmission(submissionId, {
        marks: parseInt(data.marks),
        feedback: data.feedback
      });
      
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId ? { ...sub, status: 'GRADED', marks: data.marks, feedback: data.feedback } : sub
      ));
      alert("Grade saved successfully!");
    } catch (error) {
      alert("Failed to save grade.");
    } finally {
      setProcessingId(null);
    }
  };

  const getViewerUrl = (url) => {
    if (!url) return '';
    if (url.toLowerCase().endsWith('.pdf') || url.toLowerCase().match(/\.(jpeg|jpg|png)$/)) {
      return url; 
    }
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  };

  if (loading || !assignment) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 hover:text-indigo-600 font-bold transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-gray-500 font-medium">Due: {new Date(assignment.deadline).toLocaleString()}</p>
          </div>
          <div className="bg-indigo-50 text-indigo-800 px-6 py-3 rounded-xl border border-indigo-100 text-center">
            <p className="text-sm font-bold uppercase tracking-wider">Max Marks</p>
            <p className="text-3xl font-black">{assignment.max_marks}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Submissions ({submissions.length})</h2>
          
          {submissions.length === 0 ? (
            <div className="text-center p-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-medium">
              No students have submitted this assignment yet.
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((sub) => (
                <div key={sub.id} className="border border-gray-200 rounded-2xl p-6 flex flex-col xl:flex-row gap-6 hover:shadow-md transition-shadow">
                  
                  <div className="xl:w-1/3 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{sub.profiles?.full_name || "Unknown Student"}</h3>
                      <p className="text-sm text-gray-500">{sub.profiles?.email}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${sub.status === 'LATE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {sub.status}
                      </span>
                      {sub.status === 'GRADED' && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center">
                          <CheckCircle size={12} className="mr-1" /> Graded
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={() => setPreviewUrl(getViewerUrl(sub.file_url))}
                      className="inline-flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg font-bold transition-colors w-full justify-center"
                    >
                      <FileText size={18} /> View Submission
                    </button>
                  </div>

                  {/* NEW: Re-structured Grading UI */}
                  <div className="xl:w-2/3 flex flex-col gap-5 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    
                    {/* Top Row: Marks & Rough Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Marks</label>
                        <input 
                          type="number" 
                          max={assignment.max_marks}
                          min="0"
                          value={draftGrades[sub.id]?.marks || ''}
                          onChange={(e) => handleGradeUpdate(sub.id, 'marks', e.target.value)}
                          className="w-full border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900" 
                          placeholder={`/ ${assignment.max_marks}`}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Draft Notes for AI (Optional)</label>
                        <input 
                          type="text" 
                          value={draftGrades[sub.id]?.teacherNotes || ''}
                          onChange={(e) => handleGradeUpdate(sub.id, 'teacherNotes', e.target.value)}
                          className="w-full border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                          placeholder="e.g., great code, but missed error handling"
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Final Feedback & Submit */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between items-center">
                          Final Feedback
                          <button 
                            onClick={() => handleAIFeedback(sub.id)}
                            disabled={generatingAI === sub.id}
                            className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-lg font-bold flex items-center transition-colors disabled:opacity-50"
                            title="Auto-generate feedback"
                          >
                            {generatingAI === sub.id ? <Loader2 className="animate-spin mr-1" size={14}/> : <Sparkles className="mr-1" size={14}/>}
                            AI Assist
                          </button>
                        </label>
                        <textarea 
                          rows="3"
                          value={draftGrades[sub.id]?.feedback || ''}
                          onChange={(e) => handleGradeUpdate(sub.id, 'feedback', e.target.value)}
                          className="w-full border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" 
                          placeholder="Feedback will appear here..."
                        />
                      </div>
                      <div className="md:col-span-1 flex flex-col justify-end h-full pt-6">
                        <button 
                          onClick={() => submitGrade(sub.id)}
                          disabled={processingId === sub.id}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center shadow-sm"
                        >
                          {processingId === sub.id ? <Loader2 className="animate-spin" size={20} /> : "Save Grade"}
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-6xl h-full md:h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 flex items-center"><FileText className="mr-2 text-indigo-600" size={20}/> Document Preview</h3>
              <button 
                onClick={() => setPreviewUrl(null)} 
                className="p-2 bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 w-full bg-gray-100">
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none" 
                title="Document Preview"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}