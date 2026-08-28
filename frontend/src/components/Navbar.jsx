import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ onOpenDrawer, theme, onToggleTheme }) {
  return (
    <nav className="navbar">
      <button className="navbar-icon-btn" onClick={onOpenDrawer} aria-label="Browse all songs">
        ☰
      </button>

      <Link to="/" className="navbar-brand">
        <span className="navbar-note">♪</span> Kishore Kumar
      </Link>

      <button className="navbar-icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? '☀' : '🌙'}
      </button>
    </nav>
  );
}
