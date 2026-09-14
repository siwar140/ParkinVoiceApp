// frontend/src/components/Admin/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin } from '../../services/api';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      await adminLogin(cleanEmail, cleanPassword);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Erreur connexion admin:', err);
      if (err.response?.status === 401) {
        setError('Email ou mot de passe administrateur incorrect');
      } else {
        setError(err.response?.data?.detail || 'Erreur de connexion au serveur admin');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-slate-900 text-white border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl mb-4 border border-blue-500/30">
            <ShieldCheckIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Console d'Administration
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Portail de gestion et de supervision ParkinVoice
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Administrateur
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="admin@parkinvoice.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Authentification Admin...
              </>
            ) : (
              'Connexion Espace Admin'
            )}
          </button>

          <div className="text-center pt-3 border-t border-slate-800">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Retour à l'Espace Médecin praticien
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
