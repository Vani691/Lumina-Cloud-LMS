import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;
      
      // If the role is already attached to the user metadata, use it
      if (user.user_metadata?.role) {
        setRole(user.user_metadata.role);
        setLoading(false);
        return;
      }

      // Otherwise, fetch it from the profiles table
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setRole(data.role);
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole('student'); // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  if (!user || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  if (role === 'teacher' || role === 'instructor') {
    return <TeacherDashboard />;
  }
  
  return <StudentDashboard />;
}