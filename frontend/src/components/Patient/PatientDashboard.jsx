import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientProfile, getPatientPredictions, patientLogout } from '../../services/api';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [profile, history] = await Promise.all([getPatientProfile(), getPatientPredictions()]);
        setPatient(profile);
        setPredictions(history);
      } catch (error) {
        if (error.response?.status === 401) {
          patientLogout();
          navigate('/patient/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [navigate]);

  const logout = () => {
    patientLogout();
    navigate('/patient/login', { replace: true });
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Chargement de votre espace...</div>;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Espace patient</p>
          <h1 className="mt-2 text-2xl font-black">Bonjour {patient?.first_name}</h1>
          <p className="mt-1 text-sm text-slate-300">{patient?.email}</p>
        </div>
        <button onClick={logout} className="rounded-xl border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20">Déconnexion</button>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Mes résultats</h2>
        {predictions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Aucun résultat disponible pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {predictions.map((prediction) => (
              <article key={prediction.id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{prediction.result}</p>
                  <p className="text-xs text-slate-500">{prediction.created_at ? new Date(prediction.created_at).toLocaleString('fr-FR') : 'Date inconnue'}</p>
                </div>
                <p className="text-sm font-semibold text-blue-700">Confiance : {Math.round(prediction.confidence * 100)}%</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default PatientDashboard;
