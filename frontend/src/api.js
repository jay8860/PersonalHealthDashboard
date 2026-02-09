import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const login = async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
    return response.data;
};

export const uploadFiles = async (files, onProgress) => {
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
            if (onProgress) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        }
    });
    return response.data;
};

export const getHealthData = async () => {
    const response = await axios.get(`${API_BASE_URL}/data`);
    return response.data;
};

export const deleteRecord = async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/data/${id}`);
    return response.data;
};

export const getDeepAnalysis = async (metrics, medicalHistory, ecgHistory, cdaHistory, dailyNote, timeline) => {
    const response = await axios.post(`${API_BASE_URL}/ai/coach`, { metrics, medicalHistory, ecgHistory, cdaHistory, dailyNote, timeline });
    return response.data;
};

export const deleteBulk = async (ids) => {
    const response = await axios.post(`${API_BASE_URL}/data/delete-bulk`, { ids });
    return response.data;
};

export const getDailyNotes = async (limit = 30) => {
    const response = await axios.get(`${API_BASE_URL}/notes?limit=${limit}`);
    return response.data;
};

export const createDailyNote = async (text) => {
    const response = await axios.post(`${API_BASE_URL}/notes`, { text });
    return response.data;
};

export const getTimeline = async (limit = 50) => {
    const response = await axios.get(`${API_BASE_URL}/timeline?limit=${limit}`);
    return response.data;
};

export const createTimelineEntry = async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/timeline`, payload);
    return response.data;
};

export const exportJsonBackupUrl = () => `${API_BASE_URL}/export/json`;

export const exportCsvBackupUrl = (table) => `${API_BASE_URL}/export/csv?table=${table}`;
