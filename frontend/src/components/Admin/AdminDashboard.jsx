// frontend/src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAdminDashboard, 
  getAllDoctors, 
  getAllPredictions, 
  deleteDoctor, 
  adminLogout 
} from '../../services/api';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  UserGroupIcon, 
  UsersIcon, 
  MicrophoneIcon, 
  TrashIcon, 
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'predictions'
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
    }
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dashStats, doctorsList, predictionsList] = await Promise.all([
        getAdminDashboard(),
        getAllDoctors(),
        getAllPredictions()
      ]);

      setStats(dashStats);
      setDoctors(doctorsList);
      setPredictions(predictionsList);
    } catch (err) {
      console.error('Erreur chargement admin:', err);
      if (err.response?.status === 401) {
        adminLogout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const handleDeleteDoctor = async (id, name) => {
    if (window.confirm(`Voulez-vous supprimer le médecin "${name}" et l'ensemble de ses dossiers patients/analyses ?`)) {
      try {
        await deleteDoctor(id);
        setDoctors(prev => prev.filter(d => d.id !== id));
        fetchAdminData();
      } catch (err) {
        console.error('Erreur suppression médecin:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">Administration Système</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{adminUser?.full_name || 'Administrateur'}</h1>
            <p className="text-xs text-slate-400">{adminUser?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Déconnexion Admin
        </button>
      </div>

      {/* Cartes statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Médecins</span>
            <UserGroupIcon className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats?.total_doctors || doctors.length}</p>
          <span className="text-[11px] text-slate-400">Praticiens actifs</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Total Patients</span>
            <UsersIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats?.total_patients || 0}</p>
          <span className="text-[11px] text-slate-400">Dossiers suivis</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Analyses IA</span>
            <MicrophoneIcon className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats?.total_predictions || predictions.length}</p>
          <span className="text-[11px] text-slate-400">Analyses effectuées</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Précision Modèle</span>
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{stats?.model_accuracy || 73.3}%</p>
          <span className="text-[11px] text-slate-400">Score CNN + Biométrie</span>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'doctors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          👨‍⚕️ Gestion des Médecins ({doctors.length})
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'predictions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 Supervision des Analyses ({predictions.length})
        </button>
      </div>

      {/* Vue Gestion Médecins */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-base">
            Liste des Médecins Praticiens
          </div>
          {doctors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Aucun médecin inscrit pour le moment.</div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Médecin</th>
                    <th className="px-6 py-3.5">Hôpital / Spécialité</th>
                    <th className="px-6 py-3.5">Patients</th>
                    <th className="px-6 py-3.5">Analyses</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{doc.full_name}</div>
                        <div className="text-xs text-slate-400">{doc.email} • {doc.phone || 'Sans tel'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{doc.hospital || 'Non renseigné'}</div>
                        <div className="text-xs text-slate-400">{doc.specialty || 'Généraliste'}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{doc.total_patients || 0}</td>
                      <td className="px-6 py-4 font-semibold text-blue-600">{doc.total_predictions || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteDoctor(doc.id, doc.full_name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Supprimer ce compte médecin"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vue Supervision Analyses */}
      {activeTab === 'predictions' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-base">
            Historique Global des Analyses de la Plateforme
          </div>
          {predictions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Aucune analyse réalisée sur la plateforme.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {predictions.map(pred => (
                <div key={pred.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${pred.result === 'Malade' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Patient: {pred.patient_name} <span className="text-xs font-normal text-slate-400">(Par {pred.doctor_name})</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(pred.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      pred.result === 'Malade' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {pred.result === 'Malade' ? '🔴 Malade' : '🟢 Sain'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {(pred.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
