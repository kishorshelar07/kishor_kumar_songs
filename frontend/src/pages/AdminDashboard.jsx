import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [songs, setSongs] = useState([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Kishore Kumar');
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
  });

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await axios.get('/api/songs');
      setSongs(res.data);
    } catch (err) {
      console.error('Failed to fetch songs', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const resetForm = () => {
    setTitle('');
    setArtist('Kishore Kumar');
    setAudioFile(null);
    setCoverFile(null);
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
    formData.append('audio', audioFile);
    if (coverFile) formData.append('cover', coverFile);

    setUploading(true);
    try {
      await axios.post('/api/songs', formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
      });
      resetForm();
      fetchSongs();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        handleLogout();
        return;
      }
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this song?')) return;
    try {
      await axios.delete(`/api/songs/${id}`, { headers: getAuthHeaders() });
      fetchSongs();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <h1>Admin — Manage Songs</h1>
        <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
      </div>

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
        <label className="file-label">
          Audio file (mp3) *
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            onChange={(e) => setAudioFile(e.target.files[0] || null)}
          />
        </label>
        <label className="file-label">
          Cover image (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0] || null)}
          />
        </label>
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Add Song'}
        </button>
      </form>

      <div className="admin-song-list">
        <h3>All Songs ({songs.length})</h3>
        {songs.length === 0 && <p className="empty-msg">No songs added yet.</p>}
        {songs.map((song) => (
          <div key={song._id} className="admin-song-row">
            <span>{song.title} — {song.artist}</span>
            <button className="admin-delete-btn" onClick={() => handleDelete(song._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
