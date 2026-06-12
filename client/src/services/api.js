import axios from 'axios';

// During development, API request goes to our proxy or direct port
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Auto-correct: If VITE_API_URL is configured as just the base domain without /api, append it automatically
if (API_URL && !API_URL.toLowerCase().endsWith('/api') && !API_URL.toLowerCase().endsWith('/api/')) {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  API_URL = `${base}/api`;
}

console.log('SplitSphere API initialized with base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('splitsphere_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
