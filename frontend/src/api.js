import axios from 'axios';

// In local dev, leave VITE_API_BASE empty — Vite's proxy (vite.config.js)
// forwards /api and /uploads to http://localhost:5000 automatically.
// In production (Vercel), VITE_API_BASE points at your deployed Render URL,
// e.g. https://kishore-kumar-backend.onrender.com
export const API_BASE = import.meta.env.VITE_API_BASE || '';

const api = axios.create({
  baseURL: API_BASE
});

export default api;
