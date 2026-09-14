// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './components/Dashboard/Dashboard';
import Consultation from './components/Consultation/Consultation';
import PatientsList from './components/Patients/PatientsList';
import PatientDetail from './components/Patients/PatientDetail';
import PatientForm from './components/Patients/PatientForm';
import History from './components/History/History';
import Profile from './components/Profile/Profile';
import Navbar from './components/Layout/Navbar';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import PatientLogin from './components/Patient/PatientLogin';
import PatientDashboard from './components/Patient/PatientDashboard';

// Route publique médecin : redirige vers dashboard si déjà connecté
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/dashboard'} replace /> : children;
};

// Route privée médecin : redirige vers login si non connecté
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user?.role !== 'patient' ? (user ? children : <Navigate to="/login" replace />) : <Navigate to="/patient/dashboard" replace />;
};

// Route privée Admin
const AdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('admin_token');
  return adminToken ? children : <Navigate to="/admin/login" replace />;
};

const PatientRoute = ({ children }) => {
  return localStorage.getItem('patient_token') ? children : <Navigate to="/patient/login" replace />;
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {user && <Navbar />}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          {/* Routes publiques Médecin */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* Routes Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Routes Patient */}
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/patient/dashboard" element={<PatientRoute><PatientDashboard /></PatientRoute>} />

          {/* Routes privées Médecin */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/consultation" element={<PrivateRoute><Consultation /></PrivateRoute>} />
          <Route path="/patients" element={<PrivateRoute><PatientsList /></PrivateRoute>} />
          <Route path="/patients/new" element={<PrivateRoute><PatientForm /></PrivateRoute>} />
          <Route path="/patients/:id" element={<PrivateRoute><PatientDetail /></PrivateRoute>} />
          <Route path="/patients/:id/edit" element={<PrivateRoute><PatientForm /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* Redirections */}
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;