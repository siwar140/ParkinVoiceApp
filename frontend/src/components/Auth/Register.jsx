// frontend/src/components/Auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendVerificationCode, verifyCode, register } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Formulaires, 2: Vérification
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    hospital: '',
    specialty: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Étape 1 : Envoyer le code de vérification
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Envoyer le code de vérification
      const response = await sendVerificationCode(formData.email);
      
      setSuccess(`Code de vérification envoyé à ${formData.email}`);
      setVerificationSent(true);
      setStep(2);
      
    } catch (err) {
      console.error('Erreur lors de l\'envoi du code:', err);
      if (err.response?.status === 400) {
        setError(err.response?.data?.detail || 'Cet email est déjà utilisé');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors de l\'envoi du code');
      }
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérifier le code et créer le compte
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Vérifier le code
      await verifyCode(formData.email, verificationCode);
      
      // Créer le compte
      await register(formData);
      
      // Connecter automatiquement
      await login(formData.email, formData.password);
      
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      if (err.response?.status === 400) {
        setError(err.response?.data?.detail || 'Code de vérification invalide');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors de la création du compte');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renvoyer le code
  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await sendVerificationCode(formData.email);
      setSuccess(`Nouveau code envoyé à ${formData.email}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi du code');
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
        className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 p-8 rounded-3xl shadow-xl space-y-6"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="MediVoice Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
          
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {step === 1 ? 'Créer un compte médecin' : 'Vérification par email'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {step === 1 
              ? 'Rejoignez MediVoice Clinical Suite'
              : `Un code a été envoyé à ${formData.email}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
              onSubmit={handleSendCode}
            >
              <div>
                <label htmlFor="full_name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom complet *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Dr. Jean Dupont"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adresse email professionnelle *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="dr.dupont@hopital.fr"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mot de passe *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="8 caractères minimum"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label htmlFor="hospital" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hôpital
                </label>
                <input
                  id="hospital"
                  name="hospital"
                  type="text"
                  value={formData.hospital}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="CHU de votre ville"
                />
              </div>

              <div>
                <label htmlFor="specialty" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Spécialité
                </label>
                <input
                  id="specialty"
                  name="specialty"
                  type="text"
                  value={formData.specialty}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Neurologie"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Envoi du code...
                  </>
                ) : (
                  'Envoyer le code de vérification'
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                    Se connecter
                  </Link>
                </p>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
              onSubmit={handleVerifyCode}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Entrez le code à 6 chiffres envoyé à <strong>{formData.email}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="code" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Code de vérification
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Vérification...
                  </>
                ) : (
                  'Vérifier et créer le compte'
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-xs text-slate-500">
                  Pas reçu le code ?{' '}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ← Modifier mes informations
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;