import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isLocal
  ? 'http://localhost:3001/api'
  : (import.meta.env.VITE_API_URL || 'https://royalhills-3q0i.onrender.com/api');

const api = axios.create({
  baseURL,
});


// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
