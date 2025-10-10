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

// Handle 401 responses and remove invalid tokens
apiClient.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error) => {
    // Check if the error is a 401 (Unauthorized)
    if (error.response?.status === 401) {
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      // Optionally redirect to login page
      // window.location.href = '/login';
      
      console.log('Token expired or invalid. Removed from localStorage.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;