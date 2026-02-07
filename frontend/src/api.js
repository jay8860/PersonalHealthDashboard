import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const login = async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
    return response.data;
};

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getHealthData = async () => {
    const response = await axios.get(`${API_BASE_URL}/data`);
    return response.data;
};

export const checkHealth = async () => {
    const response = await axios.get(`${API_BASE_URL}/health-check`);
    return response.data;
};
