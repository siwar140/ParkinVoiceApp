import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientLogin } from '../../services/api';

const PatientLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await patientLogin(email.trim(), password);
      navigate('/patient/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Impossible de vous connecter.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">ParkinVoice</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Espace patient</h1>
          <p className="mt-1 text-sm text-slate-500">Consultez vos résultats et votre suivi médical.</p>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Mot de passe
          <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
        <Link to="/login" className="block text-center text-sm font-semibold text-slate-500 hover:text-blue-600">Accès médecin</Link>
      </form>
    </main>
  );
};

export default PatientLogin;
