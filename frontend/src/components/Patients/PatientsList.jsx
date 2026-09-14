import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPatients, deletePatient } from '../../services/api';
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon, 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const PatientsList = () => {
  const { token } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [stats, setStats] = useState({ total: 0, withAnalyses: 0, withoutAnalyses: 0 });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (searchTerm = '') => {
    try {
      setLoading(true);
      const data = await getPatients(searchTerm);
      setPatients(data);
      
      const total = data.length;
      const withAnalyses = data.filter(p => p.predictions?.length > 0).length;
      setStats({ total, withAnalyses, withoutAnalyses: total - withAnalyses });
    } catch (error) {
      console.error('Erreur chargement patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => fetchPatients(value), 400);
    setSearchTimeout(timeout);
  };

  const handleDelete = async (patientId) => {
    if (window.confirm('Confirmer la suppression de ce dossier patient ?')) {
      try {
        await deletePatient(patientId);
        fetchPatients(search);
      } catch (error) {
        console.error('Erreur suppression patient:', error);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">👤 Dossiers Patients</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestion et suivi médical des patients du cabinet</p>
        </div>
        <Link to="/patients/new">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
            <UserPlusIcon className="w-4 h-4" />
            Nouveau patient
          </button>
        </Link>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Patients</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Avec Analyses Vocales</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.withAnalyses}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-sm border-l-4 border-l-slate-300">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sans Analyses</p>
          <p className="text-2xl font-black text-slate-400 mt-1">{stats.withoutAnalyses}</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email..."
          value={search}
          onChange={handleSearch}
          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">Chargement de la liste...</div>
        ) : patients.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-3">
            <UserIcon className="w-16 h-16 text-slate-200 mx-auto" />
            <p className="text-base font-semibold text-slate-700">Aucun patient enregistré</p>
            <p className="text-sm text-slate-400">Ajoutez votre premier dossier patient pour lancer des analyses vocales.</p>
            <Link to="/patients/new" className="inline-block">
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                Créer un dossier patient
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <div key={patient.id} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <Link to={`/patients/${patient.id}`} className="flex-1 flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0">
                    {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5">
                      {patient.birth_date && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          {patient.birth_date}
                        </span>
                      )}
                      {patient.phone && (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                          {patient.phone}
                        </span>
                      )}
                      {patient.email && (
                        <span className="flex items-center gap-1 truncate">
                          <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                          {patient.email}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-500 px-2.5 py-1 bg-slate-100 rounded-lg mr-1">
                    {patient.predictions?.length || 0} analyses
                  </span>
                  <Link to={`/patients/${patient.id}`}>
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Consulter dossier">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link to={`/patients/${patient.id}/edit`}>
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Modifier">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(patient.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Supprimer dossier"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsList;