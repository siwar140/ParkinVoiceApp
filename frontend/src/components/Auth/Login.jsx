// frontend/src/components/Auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [error, setError] = useState('');

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingLogin(true);
    setError('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      await login(cleanEmail, cleanPassword);
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors de la connexion au serveur');
      }
    } finally {
      setLoadingLogin(false);
    }
  };

  // Si chargement, afficher spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 p-8 rounded-3xl shadow-xl space-y-6"
      >
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="ParkinVoice Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-blue-600 tracking-tight">
            ParkinVoice Diagnosis Assistant
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Plateforme d'Assistance au Diagnostic Parkinson
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Adresse email professionnelle
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="dr.dupont@hopital.fr"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loadingLogin}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loadingLogin ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connexion...
              </>
            ) : (
              'Se connecter à l\'espace médical'
            )}
          </button>

          <div className="text-center pt-2 space-y-2">
            <p className="text-xs text-slate-500">
              Nouveau médecin praticien ?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Créer un compte
              </Link>
            </p>
            <div className="pt-2 border-t border-slate-100">
              <Link to="/admin/login" className="text-xs text-slate-400 hover:text-slate-700 transition-colors font-medium">
                🛡️ Espace d'Administration Système →
              </Link>
              <Link to="/patient/login" className="mt-2 block text-xs font-medium text-slate-400 transition-colors hover:text-slate-700">
                Accès espace patient →
              </Link>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;