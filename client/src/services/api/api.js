// services/api.js
import axios from 'axios';

// VITE_BASE_API_URL=http://localhost:3000/api
const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL || 'https://pharmatrace.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request headers if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));


export default apiClient;