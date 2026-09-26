import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, FileText, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function SubmitAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.getAssignmentById(id);
        setAssignment(res.data[0]);
      } catch (error) {
        console.error(error);
      }
    };
    fetchDetails();
  }, [id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first.");
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${id}/${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('assignments')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath);

      // NEW: Send the metadata to our FastAPI backend
      await api.submitAssignment({
        assignment_id: id,
        student_id: user.id,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        storage_path: filePath
      });

      alert("Assignment submitted successfully!");
      navigate('/dashboard');
      
    } catch (error) {
      console.error(error);
      alert(error.message || "Upload failed.");
    }
  };

  if (!assignment) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 hover:text-indigo-600 mb-6 font-bold transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">Coursework</span>
              <h1 className="text-3xl font-extrabold text-gray-900">{assignment.title}</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-600">{assignment.max_marks} pts</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg mb-6 leading-relaxed">{assignment.description}</p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 inline-block">
            <p className="text-sm font-bold text-gray-500">Deadline</p>
            <p className="text-gray-900 font-medium">{new Date(assignment.deadline).toLocaleString()}</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Submit Your Work</h3>
          
          <label className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors mb-6 group">
            <UploadCloud size={48} className="text-indigo-400 group-hover:text-indigo-600 mb-4 transition-colors" />
            <span className="text-gray-700 font-medium mb-1">Click to browse or drag file here</span>
            <span className="text-gray-400 text-sm">PDF, DOCX, or ZIP (Max 10MB)</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.docx,.zip" />
          </label>

          {file && (
            <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-green-50 text-green-800 rounded-xl border border-green-200">
              <FileText size={20} />
              <span className="font-bold">{file.name}</span>
            </div>
          )}

          <button onClick={handleUpload} disabled={uploading || !file} className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center mx-auto">
            {uploading ? <><Loader2 className="animate-spin mr-2" /> Uploading to Cloud...</> : "Submit Assignment"}
          </button>
        </div>

      </div>
    </div>
  );
}