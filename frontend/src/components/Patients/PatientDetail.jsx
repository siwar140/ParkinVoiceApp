import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPatient, getPatientAnalyses } from '../../services/api';
import { 
  ArrowLeftIcon, 
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [patient, setPatient] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [patientData, analysesData] = await Promise.all([
        getPatient(id),
        getPatientAnalyses(id)
      ]);
      setPatient(patientData);
      setAnalyses(analysesData);
    } catch (error) {
      console.error('Erreur chargement dossier patient:', error);
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const getAge = (birthDate) => {
    if (!birthDate) return 'Âge non renseigné';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 'Âge non renseigné';
    const age = new Date().getFullYear() - birth.getFullYear();
    return `${age} ans`;
  };

  const getGenderLabel = (gender) => {
    const genders = {
      'M': 'Masculin',
      'F': 'Féminin',
      'male': 'Masculin',
      'female': 'Féminin'
    };
    return genders[gender] || 'Non renseigné';
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">Chargement du dossier patient...</div>;
  }

  if (!patient) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">Patient introuvable.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/patients" className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 flex-shrink-0">
            {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {getAge(patient.birth_date)} • {getGenderLabel(patient.gender)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/consultation?patient=${patient.id}`}>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
              <PlusCircleIcon className="w-4 h-4" />
              Lancer Consultation
            </button>
          </Link>
          <Link to={`/patients/${patient.id}/edit`}>
            <button className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all">
              <PencilIcon className="w-4 h-4" />
              Modifier
            </button>
          </Link>
        </div>
      </div>

      {/* Cartes d'informations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Téléphone</span>
          <p className="text-sm font-medium text-slate-800 flex items-center gap-2 pt-1">
            <PhoneIcon className="w-4 h-4 text-slate-400" />
            {patient.phone || 'Non renseigné'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</span>
          <p className="text-sm font-medium text-slate-800 flex items-center gap-2 pt-1 truncate">
            <EnvelopeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {patient.email || 'Non renseigné'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inscrit depuis le</span>
          <p className="text-sm font-medium text-slate-800 flex items-center gap-2 pt-1">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            {new Date(patient.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Notes Médicales */}
      {patient.notes && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Observations & Notes Médicales</h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{patient.notes}</p>
        </div>
      )}

      {/* Historique des Analyses pour ce patient */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            Historique des consultations du patient
          </h2>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              Total : {analyses.length}
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
              Sains : {analyses.filter(a => a.result === 'Sain').length}
            </span>
            <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg">
              Malades : {analyses.filter(a => a.result === 'Malade').length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {analyses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">Aucune analyse réalisée pour ce patient.</p>
              <Link to={`/consultation?patient=${patient.id}`} className="text-sm text-blue-600 font-semibold hover:underline mt-2 inline-block">
                Lancer une consultation vocale →
              </Link>
            </div>
          ) : (
            analyses.map((analysis, index) => (
              <div key={analysis.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono font-bold min-w-[28px]">
                    #{index + 1}
                  </span>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${analysis.result === 'Malade' ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'}`}></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Analyse du {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {new Date(analysis.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    analysis.result === 'Malade'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    {analysis.result === 'Malade' ? '🔴 Malade' : '🟢 Sain'}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500 w-12 text-right">
                    {(analysis.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;