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

export const getDeepAnalysis = async (metrics, medicalHistory, ecgHistory, cdaHistory) => {
    const response = await axios.post(`${API_BASE_URL}/ai/coach`, { metrics, medicalHistory, ecgHistory, cdaHistory });
    return response.data;
};

export const deleteBulk = async (ids) => {
    const response = await axios.post(`${API_BASE_URL}/data/delete-bulk`, { ids });
    return response.data;
};
