import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitAssignment from './pages/SubmitAssignment';
import GradingPortal from './pages/GradingPortal';

export default function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* If the user is logged in, redirect them away from Auth pages */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        {/* Protect the dashboard route */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />

        {/* Protect the submit assignment route */}
        <Route path="/assignment/:id" element={user ? <SubmitAssignment /> : <Navigate to="/login" />} />

        {/* Protect the grading portal route */}
        <Route path="/grade/:id" element={user ? <GradingPortal /> : <Navigate to="/login" />} />
        
        {/* Default route redirect */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}