import React from 'react';
import { Navigate } from 'react-router-dom';

// Decodes a JWT's payload (no signature check needed client-side — the
// backend always re-verifies) just to read the "exp" field so an expired
// token bounces to login immediately instead of failing on the next click.
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export default function RequireAuth({ children }) {
  const token = localStorage.getItem('admin_token');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('admin_token');
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
