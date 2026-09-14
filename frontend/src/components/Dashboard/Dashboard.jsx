// frontend/src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHistory, getPatients } from '../../services/api';
import { 
  MicrophoneIcon, 
  UserGroupIcon, 
  UserPlusIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon as ChevronRightIcon2,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const carouselImages = [
  {
    src: '/img2.png',
    title: 'Diagnostic Précis IA',
    description: 'Détection précoce de la maladie de Parkinson grâce à l\'analyse biométrique vocale'
  },
  {
    src: '/img3.png',
    title: 'Suivi Médical Intégré',
    description: 'Dossiers patients complets et traçabilité des consultations'
  },
  {
    src: '/img4.jpg',
    title: 'Technologie de Pointe',
    description: 'Intelligence Artificielle au service de la neurologie et du diagnostic'
  },
  {
    src: '/img1.jpg',
    title: 'Assistant Clinique',
    description: 'Des outils modernes et ergonomiques pour le corps médical'
  }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyData, patientsData] = await Promise.all([
        getHistory(),
        getPatients()
      ]);

      setAllHistory(historyData);
      setRecent(historyData.slice(0, 5));
      setPatients(patientsData);
    } catch (err) {
      console.error('Erreur chargement Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        Chargement du tableau de bord médical...
      </div>
    );
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const maladeCount = allHistory.filter(h => h.result === 'Malade').length;
  const sainCount = allHistory.filter(h => h.result === 'Sain').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider">
            Cabinet Médical ParkinVoice
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bonjour, {user?.full_name || 'Dr. Médecin'}
          </h1>
          <p className="text-slate-300 text-sm capitalize">
            {today} {user?.hospital ? `• ${user.hospital}` : ''}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Link to="/consultation">
            <button className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer">
              <MicrophoneIcon className="w-5 h-5" />
              Nouvelle Consultation
            </button>
          </Link>
          <Link to="/patients/new">
            <button className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer">
              <UserPlusIcon className="w-5 h-5" />
              Nouveau Patient
            </button>
          </Link>
          <Link to="/patients">
            <button className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer">
              <UserGroupIcon className="w-5 h-5" />
              Voir Patients
            </button>
          </Link>
        </div>
      </div>

      {/* Cartes d'indicateurs rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Patients</span>
            <UsersIcon className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{patients.length}</p>
          <span className="text-[11px] text-slate-400">Dossiers actifs</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Analyses</span>
            <MicrophoneIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{allHistory.length}</p>
          <span className="text-[11px] text-slate-400">Consultations réalisées</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Cas Sains</span>
            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{sainCount}</p>
          <span className="text-[11px] text-slate-400">Analyses négatives</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Parkinson</span>
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">{maladeCount}</p>
          <span className="text-[11px] text-slate-400">Signes détectés</span>
        </div>
      </div>

      {/* Carrousel d'images */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl group">
        <div className="relative h-64 md:h-80">
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image.src}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">{image.title}</h3>
                <p className="text-sm md:text-base opacity-90">{image.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/30 hover:bg-white/50 rounded-full text-white backdrop-blur-sm transition-all cursor-pointer"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/30 hover:bg-white/50 rounded-full text-white backdrop-blur-sm transition-all cursor-pointer"
        >
          <ChevronRightIcon2 className="w-6 h-6" />
        </button>

        {/* Indicateurs */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                index === currentSlide ? 'bg-white w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Section Patients Récents */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-600" />
            Derniers Patients Enregistrés
          </h2>
          <Link to="/patients" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Voir tous les patients
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {patients.slice(0, 5).length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400 mb-4">Aucun patient enregistré pour le moment.</p>
              <Link to="/patients/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                <UserPlusIcon className="w-4 h-4" />
                Ajouter un premier patient
              </Link>
            </div>
          ) : (
            patients.slice(0, 5).map((patient) => (
              <Link 
                key={patient.id} 
                to={`/patients/${patient.id}`}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {patient.phone || patient.email || 'Pas de contact'}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-slate-400" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Dernières Consultations */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📋</span> Dernières Consultations Vocales
          </h2>
          <Link to="/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Voir tout l'historique
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              Aucune consultation effectuée pour le moment.
            </div>
          ) : (
            recent.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    item.result === 'Malade' ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.patient_name || 'Patient anonyme'}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString('fr-FR')} à {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.result === 'Malade'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    {item.result === 'Malade' ? '🔴 Malade' : '🟢 Sain'}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500 w-12 text-right">
                    {(item.confidence * 100).toFixed(0)}%
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

export default Dashboard;