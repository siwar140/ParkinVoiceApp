// frontend/src/components/Profile/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, updatePassword, uploadProfileImage, getProfileImageUrl, sendVerificationCode } from '../../services/api';
import { CameraIcon, UserCircleIcon, KeyIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    hospital: '',
    specialty: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    code: ''
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        phone: user.phone || '',
        hospital: user.hospital || '',
        specialty: user.specialty || ''
      });
      
      if (user.profile_image) {
        setProfileImage(getProfileImageUrl(user.profile_image));
      }
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      await refreshProfile();
      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!user?.email) return;
    setSendingCode(true);
    setError('');
    setSuccess('');

    try {
      await sendVerificationCode(user.email, 'change_password');
      setSuccess(`Un code de vérification à 6 chiffres a été envoyé par email à ${user.email}`);
    } catch (err) {
      console.error('Erreur envoi code:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi du code de vérification');
    } finally {
      setSendingCode(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.code) {
      setError('Veuillez demander et saisir le code de vérification reçu par email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updatePassword(passwordData);
      setSuccess('Mot de passe modifié avec succès !');
      setPasswordData({
        old_password: '',
        new_password: '',
        code: ''
      });
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la modification du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await uploadProfileImage(file);
      await refreshProfile();
      if (res?.profile_image) {
        setProfileImage(getProfileImageUrl(res.profile_image));
      }
      setSuccess('Photo de profil mise à jour avec succès');
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'upload de la photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">👤 Profil & Sécurité</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Photo de profil */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Photo de profil</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Photo de profil" 
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCircleIcon className="w-16 h-16 text-blue-500" />
              </div>
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md cursor-pointer"
              title="Changer la photo"
            >
              <CameraIcon className="w-4 h-4" />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div>
            <p className="text-sm font-semibold text-slate-700">Formats acceptés : JPEG, PNG, WEBP</p>
            <p className="text-xs text-slate-400 mt-1">Cliquez sur l'icône appareil photo pour mettre à jour votre avatar professionnel</p>
          </div>
        </div>
      </div>

      {/* Formulaire Profil */}
      <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 mb-2">Informations personnelles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nom complet</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hôpital / Clinique</label>
            <input
              type="text"
              value={formData.hospital}
              onChange={(e) => setFormData({...formData, hospital: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Spécialité médicale</label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer">
          {loading ? 'Mise à jour...' : 'Enregistrer le profil'}
        </button>
      </form>

      {/* Formulaire Mot de passe sécurisé par Email & Code */}
      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyIcon className="w-5 h-5 text-blue-600" />
            Changer le mot de passe (Confirmation par Code Email)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Par mesure de sécurité, la modification de votre mot de passe requiert un code de confirmation envoyé à votre adresse email <strong>{user?.email}</strong>.
          </p>
        </div>

        {/* Bouton de demande de code par email */}
        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-blue-900">
            <span className="font-semibold block">Étape 1 : Obtenir votre code secret</span>
            Cliquez pour envoyer un code à 6 chiffres sur votre messagerie.
          </div>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sendingCode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <EnvelopeIcon className="w-4 h-4" />
            {sendingCode ? 'Envoi du code...' : 'Recevoir le code par email'}
          </button>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Code de vérification (6 chiffres) *
            </label>
            <input
              type="text"
              maxLength={6}
              value={passwordData.code}
              onChange={(e) => setPasswordData({...passwordData, code: e.target.value.replace(/\D/g, '')})}
              placeholder="••••••"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-center font-bold tracking-widest text-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ancien mot de passe *</label>
              <input
                type="password"
                required
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau mot de passe *</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                placeholder="8 caractères minimum"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !passwordData.code} 
          className="mt-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? 'Validation en cours...' : 'Confirmer et modifier le mot de passe'}
        </button>
      </form>
    </div>
  );
};

export default Profile;