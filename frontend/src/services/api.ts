import axios from 'axios';

// ─── API Service ────────────────────────────────────────────────────
// Axios instance with interceptors for auth token and 401 handling.

const api = axios.create({
  // Use VITE_API_URL from .env in production, otherwise default to local proxy
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (token expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // C4: Skip redirect for the boot-time profile validation call — AuthContext
    // handles that 401 itself by clearing localStorage. Redirecting here would
    // race with AuthContext and cause an infinite redirect loop.
    const url = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.includes('/auth/profile')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
