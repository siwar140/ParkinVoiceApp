// frontend/src/services/api.js
import axios from 'axios';

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
console.log(`🔌 API URL: ${API_URL}`);

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
});

// ============================================================
// INTERCEPTEURS
// ============================================================

api.interceptors.request.use(
    (config) => {
        const isAdminUrl = config.url && config.url.includes('/admin');
        const adminToken = localStorage.getItem('admin_token');
        const doctorToken = localStorage.getItem('token');
        const patientToken = localStorage.getItem('patient_token');
        
        if (isAdminUrl && adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        } else if (config.url && config.url.includes('/patient') && patientToken) {
            config.headers.Authorization = `Bearer ${patientToken}`;
        } else if (doctorToken) {
            config.headers.Authorization = `Bearer ${doctorToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url || '';
            const isAdminPath = requestUrl.includes('/admin') || window.location.pathname.startsWith('/admin');
            const isPatientPath = requestUrl.includes('/patient') || window.location.pathname.startsWith('/patient');
            
            if (isAdminPath) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin');
                if (window.location.pathname !== '/admin/login') {
                    window.location.href = '/admin/login';
                }
            } else if (isPatientPath) {
                localStorage.removeItem('patient_token');
                localStorage.removeItem('patient');
                if (window.location.pathname !== '/patient/login') {
                    window.location.href = '/patient/login';
                }
            } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                if (window.location.pathname !== '/login' && 
                    window.location.pathname !== '/register' && 
                    window.location.pathname !== '/forgot-password' && 
                    window.location.pathname !== '/reset-password') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ============================================================
// AUTHENTIFICATION (MÉDECIN)
// ============================================================

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify({
            ...(response.data.doctor || response.data.user),
            role: response.data.role || 'doctor',
        }));
    }
    return response.data;
};

export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getProfile = async () => {
    const response = await api.get('/doctor/profile');
    return response.data;
};

export const updateProfile = async (data) => {
    const response = await api.put('/doctor/profile', data);
    return response.data;
};

export const updatePassword = async (data) => {
    const response = await api.put('/doctor/password', data);
    return response.data;
};

export const uploadProfileImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/doctor/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getProfileImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}/uploads/profiles/${filename}`;
};

// ============================================================
// VÉRIFICATION EMAIL
// ============================================================

export const sendVerificationCode = async (email, purpose = 'registration') => {
    const response = await api.post('/verification/send-code', { email, purpose });
    return response.data;
};

export const verifyCode = async (email, code, purpose = 'registration') => {
    const response = await api.post('/verification/verify-code', { email, code, purpose });
    return response.data;
};

export const sendResetPasswordCode = async (email) => {
    const response = await api.post('/verification/send-code', { 
        email, 
        purpose: 'reset_password' 
    });
    return response.data;
};

export const resetPassword = async (email, code, newPassword) => {
    const response = await api.post('/auth/reset-password', {
        email, code, new_password: newPassword
    });
    return response.data;
};

// ============================================================
// PATIENTS
// ============================================================

export const getPatients = async () => {
    const response = await api.get('/patients');
    return response.data;
};

export const getPatient = async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
};

export const createPatient = async (data) => {
    const response = await api.post('/patients', data);
    return response.data;
};

export const updatePatient = async (id, data) => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
};

export const deletePatient = async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
};

export const getPatientAnalyses = async (patientId) => {
    const response = await api.get(`/patients/${patientId}/analyses`);
    return response.data;
};

// ============================================================
// PRÉDICTIONS
// ============================================================

export const predictAudio = async (audioFile, patientId = null, patientName = null, notes = null) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    if (patientId) formData.append('patient_id', patientId);
    if (patientName) formData.append('patient_name', patientName);
    if (notes) formData.append('notes', notes);
    
    const response = await api.post('/prediction/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getHistory = async () => {
    const response = await api.get('/prediction/history');
    return response.data;
};

export const deletePrediction = async (id) => {
    const response = await api.delete(`/prediction/${id}`);
    return response.data;
};

// ============================================================
// ADMIN
// ============================================================

export const adminLogin = async (email, password) => {
    const response = await api.post('/admin/login', { email, password });
    if (response.data.access_token) {
        localStorage.setItem('admin_token', response.data.access_token);
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
    }
    return response.data;
};

export const adminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
};

// ============================================================
// AUTHENTIFICATION PATIENT
// ============================================================

export const patientLogin = async (email, password) => {
    const response = await api.post('/patient/login', { email, password });
    if (response.data.access_token) {
        localStorage.setItem('patient_token', response.data.access_token);
        localStorage.setItem('patient', JSON.stringify(response.data.patient));
    }
    return response.data;
};

export const patientLogout = () => {
    localStorage.removeItem('patient_token');
    localStorage.removeItem('patient');
};

export const getPatientProfile = async () => {
    const response = await api.get('/patient/me');
    return response.data;
};

export const getPatientPredictions = async () => {
    const response = await api.get('/patient/predictions');
    return response.data;
};

export const getAdminDashboard = async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
};

export const getAllDoctors = async () => {
    const response = await api.get('/admin/doctors');
    return response.data;
};

export const getDoctorDetails = async (id) => {
    const response = await api.get(`/admin/doctors/${id}`);
    return response.data;
};

export const deleteDoctor = async (id) => {
    const response = await api.delete(`/admin/doctors/${id}`);
    return response.data;
};

export const getAllPredictions = async () => {
    const response = await api.get('/admin/predictions');
    return response.data;
};

export const getDoctorsStats = async () => {
    const response = await api.get('/admin/stats/doctors');
    return response.data;
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default api;
