import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single-song add form
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Kishore Kumar');
  const [category, setCategory] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverSuggestions, setCoverSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Bulk add form
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkArtist, setBulkArtist] = useState('Kishore Kumar');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkMessage, setBulkMessage] = useState('');

  // Edit modal
  const [editingSong, setEditingSong] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLyrics, setEditLyrics] = useState('');
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Drag-and-drop reorder
  const [dragIndex, setDragIndex] = useState(null);
  const [reordering, setReordering] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/songs');
      setSongs(res.data);
    } catch (err) {
      console.error('Failed to fetch songs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const resetForm = () => {
    setTitle('');
    setArtist('Kishore Kumar');
    setCategory('');
    setLyrics('');
    setAudioFile(null);
    setCoverFile(null);
    setCoverUrl('');
    setCoverSuggestions([]);
  };

  const handleSuggestCover = async () => {
    if (!title.trim()) {
      setError('Type a title first, then suggest a cover');
      return;
    }
    setSuggesting(true);
    setError('');
    try {
      const res = await api.get('/api/songs/suggest-cover', {
        params: { title, artist }
      });
      setCoverSuggestions(res.data.suggestions || []);
      if ((res.data.suggestions || []).length === 0) {
        setError('No cover suggestions found — try a simpler title, or upload your own.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Cover lookup failed');
    } finally {
      setSuggesting(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !audioFile) {
      setError('Title and audio file are required');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('category', category);
    formData.append('lyrics', lyrics);
    formData.append('audio', audioFile);
    if (coverFile) {
      formData.append('cover', coverFile);
    } else if (coverUrl) {
      formData.append('coverUrl', coverUrl);
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      await api.post('/api/songs', formData, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        }
      });
      resetForm();
      fetchSongs();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    setBulkMessage('');
    if (bulkFiles.length === 0) {
      setBulkMessage('Pick at least one mp3 file first');
      return;
    }

    const formData = new FormData();
    bulkFiles.forEach((f) => formData.append('audios', f));
    formData.append('artist', bulkArtist);
    formData.append('category', bulkCategory);

    setBulkUploading(true);
    setBulkProgress(0);
    try {
      const res = await api.post('/api/songs/bulk', formData, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            setBulkProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        }
      });
      setBulkMessage(`Added ${res.data.created} songs. You can rename titles individually via Edit.`);
      setBulkFiles([]);
      fetchSongs();
    } catch (err) {
      setBulkMessage(err.response?.data?.error || 'Bulk upload failed');
    } finally {
      setBulkUploading(false);
      setBulkProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this song?')) return;
    try {
      await api.delete(`/api/songs/${id}`);
      fetchSongs();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const openEdit = (song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditCategory(song.category || '');
    setEditLyrics(song.lyrics || '');
    setEditCoverFile(null);
    setEditError('');
  };

  const closeEdit = () => {
    setEditingSong(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editTitle.trim()) {
      setEditError('Title is required');
      return;
    }
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('artist', editArtist);
    formData.append('category', editCategory);
    formData.append('lyrics', editLyrics);
    if (editCoverFile) formData.append('cover', editCoverFile);

    setEditSaving(true);
    try {
      await api.put(`/api/songs/${editingSong._id}`, formData);
      closeEdit();
      fetchSongs();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  // --- Drag-and-drop reordering ---
  const handleDragStart = (index) => setDragIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const reordered = [...songs];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setSongs(reordered);
    setDragIndex(null);

    setReordering(true);
    try {
      const items = reordered.map((s, idx) => ({ id: s._id, order: idx }));
      await api.put('/api/songs/reorder/batch', { items });
    } catch (err) {
      console.error('Reorder save failed', err);
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <h1>Admin — Manage Songs</h1>
        <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-grid">
        {/* --- Single song add --- */}
        <form className="admin-add-form" onSubmit={handleAdd}>
          <h3>Add New Song</h3>
          <input
            type="text"
            placeholder="Song title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
          <input
            type="text"
            placeholder="Category (e.g. Romantic, 70s Classics)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <textarea
            placeholder="Lyrics (optional)"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={3}
          />
          <label className="file-label">
            Audio file (mp3) *
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,.mp3"
              onChange={(e) => setAudioFile(e.target.files[0] || null)}
            />
          </label>
          <label className="file-label">
            Cover image (optional, upload your own)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setCoverFile(e.target.files[0] || null);
                setCoverUrl('');
                setCoverSuggestions([]);
              }}
            />
          </label>

          <button type="button" className="secondary-btn" onClick={handleSuggestCover} disabled={suggesting}>
            {suggesting ? 'Searching...' : 'Suggest Cover from Title'}
          </button>

          {coverSuggestions.length > 0 && (
            <div className="cover-suggestions">
              {coverSuggestions.map((s, i) => (
                <button
                  type="button"
                  key={i}
                  className={`cover-suggestion${coverUrl === s.artwork ? ' selected' : ''}`}
                  onClick={() => {
                    setCoverUrl(s.artwork);
                    setCoverFile(null);
                  }}
                >
                  <img src={s.artwork} alt={s.trackName} />
                </button>
              ))}
            </div>
          )}

          {error && <p className="admin-error">{error}</p>}
          {uploading && (
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <button type="submit" disabled={uploading}>
            {uploading ? `Uploading... ${uploadProgress}%` : 'Add Song'}
          </button>
        </form>

        {/* --- Bulk add --- */}
        <form className="admin-add-form" onSubmit={handleBulkAdd}>
          <h3>Bulk Add Songs</h3>
          <p className="hint-text">Pick many mp3 files at once — titles are auto-generated from filenames.</p>
          <label className="file-label">
            Audio files (mp3, multiple) *
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,.mp3"
              multiple
              onChange={(e) => setBulkFiles(Array.from(e.target.files || []))}
            />
          </label>
          {bulkFiles.length > 0 && <p className="hint-text">{bulkFiles.length} file(s) selected</p>}
          <input
            type="text"
            placeholder="Artist (applies to all)"
            value={bulkArtist}
            onChange={(e) => setBulkArtist(e.target.value)}
          />
          <input
            type="text"
            placeholder="Category (applies to all, optional)"
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value)}
          />
          {bulkMessage && <p className="admin-error">{bulkMessage}</p>}
          {bulkUploading && (
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${bulkProgress}%` }} />
            </div>
          )}
          <button type="submit" disabled={bulkUploading}>
            {bulkUploading ? `Uploading... ${bulkProgress}%` : 'Bulk Add'}
          </button>
        </form>
      </div>

      <div className="admin-song-list">
        <h3>
          All Songs ({songs.length}) {reordering && <span className="hint-text">saving order...</span>}
        </h3>
        <p className="hint-text">Drag rows by the ⠿ handle to reorder.</p>
        {loading && <p className="empty-msg">Loading...</p>}
        {!loading && songs.length === 0 && <p className="empty-msg">No songs added yet.</p>}
        {songs.map((song, index) => (
          <div
            key={song._id}
            className="admin-song-row"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
          >
            <span className="drag-handle">⠿</span>
            <span className="admin-song-info">
              {song.title} — {song.artist}
              {song.category && <span className="admin-song-category">{song.category}</span>}
            </span>
            <div className="admin-song-actions">
              <button className="admin-edit-btn" onClick={() => openEdit(song)}>Edit</button>
              <button className="admin-delete-btn" onClick={() => handleDelete(song._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editingSong && (
        <div className="modal-overlay" onClick={closeEdit}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSaveEdit}>
            <h3>Edit Song</h3>
            <input
              type="text"
              placeholder="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Artist"
              value={editArtist}
              onChange={(e) => setEditArtist(e.target.value)}
            />
            <input
              type="text"
              placeholder="Category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            />
            <textarea
              placeholder="Lyrics"
              value={editLyrics}
              onChange={(e) => setEditLyrics(e.target.value)}
              rows={4}
            />
            <label className="file-label">
              Replace cover image (optional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditCoverFile(e.target.files[0] || null)}
              />
            </label>
            {editError && <p className="admin-error">{editError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeEdit}>Cancel</button>
              <button type="submit" disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
