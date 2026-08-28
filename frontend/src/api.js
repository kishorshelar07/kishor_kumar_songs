import axios from 'axios';

// In local dev, leave VITE_API_BASE empty — Vite's proxy (vite.config.js)
// forwards /api and /uploads to http://localhost:5000 automatically.
// In production (Vercel), VITE_API_BASE points at your deployed Render URL,
// e.g. https://kishore-kumar-backend.onrender.com
export const API_BASE = import.meta.env.VITE_API_BASE || '';

const api = axios.create({
  baseURL: API_BASE
});

// If the admin token is missing/expired/invalid, the backend replies 401.
// Auto-clear it and bounce to the login page so a stale session never just
// silently fails on every click.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const hadToken = !!localStorage.getItem('admin_token');
      localStorage.removeItem('admin_token');
      if (hadToken && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
