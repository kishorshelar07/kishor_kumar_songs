import React, { useMemo, useState } from 'react';
import { useFavorites } from '../context/FavoritesContext.jsx';

export default function SongListDrawer({ open, onClose, songs, onSelect, currentSongId }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const categories = useMemo(() => {
    const set = new Set();
    songs.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [songs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return songs.filter((s) => {
      const matchesSearch =
        !term ||
        s.title.toLowerCase().includes(term) ||
        (s.artist || '').toLowerCase().includes(term);
      const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
      const matchesFavorites = !showFavoritesOnly || favorites.includes(s._id);
      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [songs, search, activeCategory, showFavoritesOnly, favorites]);

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`drawer${open ? ' open' : ''}`}>
        <div className="drawer-header">
          <h3>All Songs</h3>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <input
          type="text"
          className="drawer-search"
          placeholder="Search by title or artist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="drawer-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
          <button
            className={`chip chip-fav${showFavoritesOnly ? ' active' : ''}`}
            onClick={() => setShowFavoritesOnly((v) => !v)}
          >
            ♥ Favorites
          </button>
        </div>

        <div className="drawer-list">
          {filtered.length === 0 && <p className="empty-msg">No songs match.</p>}
          {filtered.map((song) => (
            <div key={song._id} className={`drawer-item${song._id === currentSongId ? ' active' : ''}`}>
              <button className="drawer-item-main" onClick={() => onSelect(song)}>
                <span className="drawer-item-title">{song.title}</span>
                <span className="drawer-item-artist">{song.artist}</span>
              </button>
              <button
                className={`drawer-fav-btn${isFavorite(song._id) ? ' active' : ''}`}
                onClick={() => toggleFavorite(song._id)}
                aria-label="Toggle favorite"
              >
                ♥
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
