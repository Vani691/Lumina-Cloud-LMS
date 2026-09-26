import { useAuth } from '../context/AuthContext';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  // Route to the correct dashboard based on the user's role in your Supabase database
  if (user.role === 'teacher') {
    return <TeacherDashboard />;
  }
  
  // Default to student view
  return <StudentDashboard />;
}