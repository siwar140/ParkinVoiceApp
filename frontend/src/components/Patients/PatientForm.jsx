import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getPatient, createPatient, updatePatient } from '../../services/api';
import { ArrowLeftIcon, UserIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const PatientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'male',
    phone: '',
    email: '',
    password: '',
    notes: ''
  });

  useEffect(() => {
    if (isEditing) {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    try {
      setFetching(true);
      const data = await getPatient(id);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        birth_date: data.birth_date || '',
        gender: data.gender || 'male',
        phone: data.phone || '',
        email: data.email || '',
        password: '',
        notes: data.notes || ''
      });
    } catch (err) {
      console.error('Erreur chargement patient:', err);
      setError('Impossible de charger les informations du patient');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await updatePatient(id, formData);
        navigate(`/patients/${id}`);
      } else {
        const newPatient = await createPatient(formData);
        navigate(`/patients/${newPatient.id}`);
      }
    } catch (err) {
      console.error('Erreur enregistrement patient:', err);
      if (err.response?.status === 401) {
        setError('Session expirée, veuillez vous reconnecter');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement du patient');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-400">
        Chargement des informations du patient...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* En-tête avec bouton Retour */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={isEditing ? `/patients/${id}` : '/patients'} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? 'Modifier le dossier patient' : 'Nouveau dossier patient'}
          </h1>
          <p className="text-sm text-slate-500">
            {isEditing ? 'Mettre à jour les coordonnées et observations' : 'Ajouter un patient au cabinet médical'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Prénom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Nom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de naissance
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Genre
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              >
                <option value="male">Homme</option>
                <option value="female">Femme</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="+33 6 00 00 00 00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="patient@exemple.com"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe patient *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Au moins 8 caractères"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes & Observations médicales
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="Antécédents, traitements en cours, remarques cliniques..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(isEditing ? `/patients/${id}` : '/patients')}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? (isEditing ? 'Mise à jour...' : 'Création...') : (isEditing ? 'Enregistrer les modifications' : 'Créer le patient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;