import React, { useState } from 'react';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/admin/login', { password });
      localStorage.setItem('admin_token', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError('Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-bg">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
