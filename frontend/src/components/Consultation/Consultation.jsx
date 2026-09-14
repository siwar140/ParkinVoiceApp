// frontend/src/components/Consultation/Consultation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { predictAudio, getPatients, createPatient } from '../../services/api';
import { convertToWav } from '../../utils/audioUtils';
import {
  MicrophoneIcon,
  DocumentArrowUpIcon,
  XCircleIcon,
  CheckCircleIcon,
  UserPlusIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  PrinterIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Consultation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // Mode de saisie audio : 'file' | 'mic'
  const [inputMode, setInputMode] = useState('mic');

  // État du micro & MediaRecorder
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Vérifier paramètre URL ?patient=ID
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const patientParam = queryParams.get('patient');
    if (patientParam) {
      setSelectedPatient(patientParam);
    }
  }, [location]);

  // Charger la liste des patients
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Erreur chargement patients:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  // Visualiseur audio en direct lors de l'enregistrement
  const startVisualizer = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;
          ctx.fillStyle = `rgb(59, 130, 246)`;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
          ctx.fill();
          x += barWidth;
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (e) {
      console.error('Erreur visualiseur audio:', e);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  // Gestion du téléversement de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExts = ['.wav', '.mp3', '.ogg', '.webm', '.m4a', '.flac', '.aac'];
      const fileNameLower = file.name.toLowerCase();
      const isValid = allowedExts.some(ext => fileNameLower.endsWith(ext)) || file.type.startsWith('audio/');
      
      if (!isValid) {
        setError('Format de fichier non supporté. Utilisez WAV, MP3, OGG ou WEBM.');
        return;
      }
      
      setAudioFile(file);
      setAudioPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  // Enregistrement vocal direct via le Micro
  const startRecording = async () => {
    try {
      setError('');
      setAudioFile(null);
      setAudioPreviewUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      startVisualizer(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopVisualizer();
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          // Convertir en WAV
          const wavFile = await convertToWav(audioBlob);
          setAudioFile(wavFile);
          setAudioPreviewUrl(URL.createObjectURL(wavFile));
        } catch (err) {
          console.error('Erreur conversion WAV:', err);
          const file = new File([audioBlob], `voix_patient_${Date.now()}.webm`, { type: 'audio/webm' });
          setAudioFile(file);
          setAudioPreviewUrl(URL.createObjectURL(audioBlob));
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Erreur accès microphone:', err);
      setError('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès vocal dans votre navigateur.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const clearAudio = () => {
    stopVisualizer();
    setAudioFile(null);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPlayingPreview(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  const togglePreviewPlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingPreview) {
      audioPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleAnalyze = async () => {
    if (!audioFile) {
      setError('Veuillez effectuer un enregistrement vocal ou choisir un fichier audio.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let patientId = selectedPatient || null;
      let patientName = null;

      if (selectedPatient) {
        const patient = patients.find(p => p.id === parseInt(selectedPatient));
        if (patient) {
          patientName = `${patient.first_name} ${patient.last_name}`;
        }
      }

      const result = await predictAudio(audioFile, patientId, patientName, notes || null);
      setPrediction(result);
      
    } catch (err) {
      console.error('Erreur analyse:', err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.response?.data?.detail || 'Erreur lors du traitement de l\'analyse vocale');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewPatient = async (patientData) => {
    try {
      const newPatient = await createPatient(patientData);
      setPatients([...patients, newPatient]);
      setSelectedPatient(newPatient.id.toString());
      setShowNewPatientModal(false);
      setError('');
    } catch (err) {
      console.error('Erreur création patient:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la création du patient');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const details = prediction?.details || {};
  const acoustics = details?.acoustics || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">🎤</span>
          Consultation & Analyse Vocale Biométrique
        </h1>
        <p className="text-sm text-slate-500">
          Enregistrement biométrique de la voix et dépistage par Intelligence Artificielle (Réseau de Neurones CNN & Marqueurs Acoustiques).
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Choix du Patient */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Patient associé
          </label>
          <div className="flex gap-2">
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">Sélectionner un patient (Optionnel)</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} {patient.birth_date ? `(${patient.birth_date})` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewPatientModal(true)}
              className="px-5 py-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
              title="Ajouter un nouveau patient"
            >
              <UserPlusIcon className="w-5 h-5" />
              Nouveau
            </button>
          </div>
        </div>

        {/* Choix de Source (Micro vs Fichier) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Source Audio
          </label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => { setInputMode('mic'); clearAudio(); }}
              className={`py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'mic'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MicrophoneIcon className="w-4 h-4" />
              Enregistrement Direct Micro
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('file'); clearAudio(); }}
              className={`py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'file'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DocumentArrowUpIcon className="w-4 h-4" />
              Téléverser un Fichier Audio
            </button>
          </div>
        </div>

        {/* Zone de Capture Vocal */}
        <div className="p-8 border border-slate-200 rounded-3xl bg-gradient-to-b from-slate-50/80 to-white flex flex-col items-center justify-center text-center relative overflow-hidden">
          {inputMode === 'mic' ? (
            <div className="w-full space-y-4">
              {!isRecording && !audioPreviewUrl && (
                <div className="py-6 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-24 h-24 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 hover:scale-105 transition-all group cursor-pointer"
                  >
                    <MicrophoneIcon className="w-12 h-12 group-hover:animate-pulse" />
                  </button>
                  <p className="mt-4 text-base font-bold text-slate-800">Démarrer l'enregistrement vocal</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Demandez au patient de prononcer la voyelle « Aaaa » de manière stable et continue pendant 3 à 5 secondes.
                  </p>
                </div>
              )}

              {isRecording && (
                <div className="py-6 flex flex-col items-center space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-28 h-28 bg-red-400/20 rounded-full animate-ping"></div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="relative w-24 h-24 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/30 cursor-pointer"
                    >
                      <StopIcon className="w-12 h-12" />
                    </button>
                  </div>
                  
                  {/* Visualiseur de fréquences canvas */}
                  <div className="w-full max-w-xs h-12 flex items-center justify-center my-2">
                    <canvas ref={canvasRef} width={280} height={48} className="rounded-lg" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-3xl font-mono font-black text-slate-900">{formatTime(recordingTime)}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Enregistrement biométrique en cours... Cliquez sur le bouton rouge pour terminer.</p>
                </div>
              )}

              {audioPreviewUrl && !isRecording && (
                <div className="py-4 space-y-4 w-full">
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-all cursor-pointer"
                      >
                        {isPlayingPreview ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
                      </button>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">Échantillon vocal capturé</p>
                        <p className="text-xs text-slate-400 font-mono">Durée enregistrée : {formatTime(recordingTime || 3)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearAudio}
                      className="p-2.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Effacer et recommencer"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <audio
                    ref={audioPlayerRef}
                    src={audioPreviewUrl}
                    onEnded={() => setIsPlayingPreview(false)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full py-6">
              <input
                id="fileInput"
                type="file"
                accept=".wav,.mp3,.ogg,.webm,.m4a"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-colors cursor-pointer"
              />
              <p className="mt-3 text-xs text-slate-400">
                Formats acceptés : WAV, MP3, OGG, WEBM, M4A • Voix soutenue de 3s recommandée
              </p>
            </div>
          )}
        </div>

        {/* Formulaire de Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Notes & Observations du médecin praticien
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Observations cliniques (trémolos, ralentissement du débit vocal, symptômes du patient...)"
          />
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center gap-3 text-sm text-red-600 bg-red-50 p-4 rounded-2xl border border-red-200">
            <XCircleIcon className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Bouton de Lancement */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!audioFile || loading || isRecording}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Traitement par le Modèle d'IA & Biomarkers...
            </>
          ) : (
            <>
              <MicrophoneIcon className="w-5 h-5" />
              Lancer le Diagnostic IA & Biométrique
            </>
          )}
        </button>
      </div>

      {/* Résultat détaillé */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
            prediction.result === 'Malade'
              ? 'border-red-200 bg-red-50/70'
              : 'border-emerald-200 bg-emerald-50/70'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-6 mb-6 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Résultat du Dépistage IA</span>
              <h2 className={`text-3xl font-black mt-1 ${
                prediction.result === 'Malade' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {prediction.result === 'Malade' ? '🔴 Présence de Signes (Parkinson)' : '🟢 Sain (Aucun signe détecté)'}
              </h2>
            </div>
            <div className="text-left sm:text-right bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Niveau de Confiance</span>
              <p className="text-3xl font-black text-slate-900">
                {(prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Grille des Marqueurs Acoustiques */}
          {Object.keys(acoustics).length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ChartBarIcon className="w-4 h-4 text-blue-600" />
                Indicateurs Acoustiques Biométriques
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/90 p-4 rounded-2xl border border-slate-200/80 text-center">
                  <span className="text-xs text-slate-400 block font-medium">Pitch F0 Moyen</span>
                  <span className="text-lg font-bold text-slate-800">{acoustics.f0_mean_hz} Hz</span>
                </div>
                <div className="bg-white/90 p-4 rounded-2xl border border-slate-200/80 text-center">
                  <span className="text-xs text-slate-400 block font-medium">Jitter (%)</span>
                  <span className="text-lg font-bold text-slate-800">{acoustics.jitter_percent}%</span>
                </div>
                <div className="bg-white/90 p-4 rounded-2xl border border-slate-200/80 text-center">
                  <span className="text-xs text-slate-400 block font-medium">Shimmer (%)</span>
                  <span className="text-lg font-bold text-slate-800">{acoustics.shimmer_percent}%</span>
                </div>
                <div className="bg-white/90 p-4 rounded-2xl border border-slate-200/80 text-center">
                  <span className="text-xs text-slate-400 block font-medium">HNR (Rapport Bruit)</span>
                  <span className="text-lg font-bold text-slate-800">{acoustics.hnr_db} dB</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 mb-6 bg-white/80 p-4 rounded-2xl border border-slate-200/80">
            {prediction.patient_name && (
              <div>
                <span className="text-slate-400 font-medium">Patient : </span>
                <span className="font-bold text-slate-900">{prediction.patient_name}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 font-medium">Date du diagnostic : </span>
              <span className="font-bold text-slate-900">{new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            {notes && (
              <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-2">
                <span className="text-slate-400 font-medium">Notes médicales : </span>
                <span className="font-medium text-slate-800">{notes}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircleIcon className="w-4 h-4" />
              Rapport d'analyse enregistré dans le dossier du patient.
            </span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-bold transition-all shadow-sm cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4 text-slate-500" />
              Imprimer la Fiche Médicale
            </button>
          </div>
        </motion.div>
      )}

      {/* Modal Nouveau Patient */}
      {showNewPatientModal && (
        <NewPatientModal
          onClose={() => setShowNewPatientModal(false)}
          onSave={handleNewPatient}
        />
      )}
    </motion.div>
  );
};

// Modal Nouveau Patient
const NewPatientModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'male',
    phone: '',
    email: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

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
    try {
      await onSave(formData);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Ajouter un nouveau patient</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date de naissance</label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Genre</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="male">Homme</option>
                <option value="female">Femme</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer le patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Consultation;