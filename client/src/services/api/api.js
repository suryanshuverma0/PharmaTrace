// services/api.js
import axios from 'axios';

// VITE_BASE_API_URL=http://localhost:3000/api
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://pharmatrace.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Automatically handle token + correct headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // ✅ Only set JSON header if the body is NOT FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle 401 (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      console.log('Token expired or invalid. Removed from localStorage.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
