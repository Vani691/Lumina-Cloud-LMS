import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { error } = await signUp(email, password, name, role);
    
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard'); // Auto-redirect to dashboard on success
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-4">
      <div className="w-full max-w-lg animate-float bg-white/20 backdrop-blur-xl border border-white/30 p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] text-white">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Create Account</h1>
          <p className="text-white/80">Join the Lumina ecosystem.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-100">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
              <input 
                type="text" required
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="John Doe"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
              <input 
                type="email" required
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="you@university.edu"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
              <input 
                type="password" required minLength="6"
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-3 rounded-xl border transition-all ${role === 'student' ? 'bg-white text-indigo-600 border-white font-bold shadow-lg' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-3 rounded-xl border transition-all ${role === 'teacher' ? 'bg-white text-indigo-600 border-white font-bold shadow-lg' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
              >
                Teacher
              </button>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-white text-indigo-600 font-bold py-3 px-4 rounded-xl hover:bg-white/90 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Account...' : <><UserPlus size={20} /> Register</>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account? <Link to="/login" className="text-white font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}