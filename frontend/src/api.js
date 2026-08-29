import axios from 'axios';

// In local dev, leave VITE_API_BASE empty — Vite's proxy (vite.config.js)
// forwards /api and /uploads to http://localhost:5000 automatically.
// In production (Vercel), VITE_API_BASE points at your deployed Render URL,
// e.g. https://kishore-kumar-backend.onrender.com
export const API_BASE = import.meta.env.VITE_API_BASE || '';

const api = axios.create({
  baseURL: API_BASE
});

// Automatically attach the admin token (if present) to every request, so
// individual pages never need to build the Authorization header themselves.
// Without this, every admin action (add/edit/delete/reorder) would go out
// unauthenticated and the backend would reject it.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
