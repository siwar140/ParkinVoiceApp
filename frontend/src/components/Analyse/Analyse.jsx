import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { predictAudio } from '../../services/api';
import {
  MicrophoneIcon,
  DocumentArrowUpIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const Analyse = () => {
  const { token } = useAuth();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setError('');
    }
  };

  const handlePredict = async () => {
    if (!audioFile) {
      setError('Veuillez sélectionner un fichier audio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await predictAudio(audioFile, null, patientName);
      setPrediction(result);
      setAudioFile(null);
      setPatientName('');
      const input = document.getElementById('fileInput');
      if (input) input.value = '';
    } catch (err) {
      console.error('Erreur analyse:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🎤 Analyse vocale</h1>
      <p className="text-sm text-gray-500 mb-6">
        Téléchargez un enregistrement pour détecter la maladie de Parkinson
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du patient
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Optionnel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fichier audio
            </label>
            <div className="relative">
              <input
                id="fileInput"
                type="file"
                accept=".wav,.mp3,.ogg"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 transition-colors cursor-pointer"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Formats : WAV, MP3, OGG</p>
          </div>

          {audioFile && (
            <div className="flex items-center gap-3 text-sm text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{audioFile.name}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
              <XCircleIcon className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={!audioFile || loading}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Analyse en cours...
              </>
            ) : (
              <>
                <MicrophoneIcon className="w-5 h-5" />
                Analyser
              </>
            )}
          </button>
        </div>
      </div>

      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 p-5 rounded-2xl border ${
            prediction.result === 'Malade'
              ? 'border-red-200 bg-red-50'
              : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Résultat</p>
              <p className={`text-2xl font-bold ${
                prediction.result === 'Malade' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {prediction.result === 'Malade' ? '🔴 Malade' : '🟢 Sain'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Confiance</p>
              <p className="text-xl font-bold text-gray-900">
                {(prediction.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400 border-t border-gray-200 pt-3">
            💾 Analyse enregistrée dans l'historique
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Analyse;