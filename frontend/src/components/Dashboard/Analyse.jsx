import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { predictAudio } from '../../services/api';

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
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Analyse vocale</h1>
      <p className="text-sm text-gray-500 mb-6">Téléchargez un enregistrement pour la détection</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Nom du patient <span className="text-gray-400 text-xs">(optionnel)</span>
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Jean Dupont"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Fichier audio
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".wav,.mp3,.ogg"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 transition-colors cursor-pointer"
            />
            <p className="mt-1.5 text-xs text-gray-400">Formats acceptés : WAV, MP3, OGG</p>
          </div>

          {audioFile && (
            <div className="flex items-center gap-2.5 text-sm text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-lg">
              <span>✓</span>
              <span className="truncate">{audioFile.name}</span>
              <span className="text-xs text-gray-400 ml-auto">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
              <span>✕</span>
              {error}
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={!audioFile || loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Analyse en cours...' : 'Analyser'}
          </button>
        </div>
      </div>

      {prediction && (
        <div className={`mt-6 p-5 rounded-xl border ${
          prediction.result === 'Malade'
            ? 'border-red-200 bg-red-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Résultat</p>
              <p className={`text-xl font-semibold ${
                prediction.result === 'Malade' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {prediction.result}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Confiance</p>
              <p className="text-xl font-semibold text-gray-800">
                {(prediction.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400 border-t border-gray-200 pt-3">
            💾 Analyse enregistrée dans l'historique
          </p>
        </div>
      )}
    </div>
  );
};

export default Analyse;