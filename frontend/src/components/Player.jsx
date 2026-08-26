import React, { useRef, useEffect, useState } from 'react';
import { API_BASE } from '../api.js';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function Player({ song, isPlaying, onPlayPause, onNext, onPrev, onEnded }) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, song]);

  // Reset displayed time whenever a different song loads
  useEffect(() => {
    setProgress(0);
    setDuration(0);
  }, [song?._id]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const value = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setProgress(value);
    }
  };

  if (!song) {
    return (
      <div className="player-minimal">
        <p className="empty-msg">No songs yet. Ask the admin to add some.</p>
      </div>
    );
  }

  const coverUrl = song.coverImage
    ? `${API_BASE}/uploads/covers/${song.coverImage}`
    : null;
  const audioUrl = `${API_BASE}/uploads/songs/${song.audioFile}`;

  return (
    <div className="player-minimal">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
      />

      <div className="record-stage">
        <div className={`cover-wrap${isPlaying ? ' spinning' : ''}`}>
          {coverUrl ? (
            <img src={coverUrl} alt={song.title} className="cover-img" />
          ) : (
            <div className="cover-placeholder">🎵</div>
          )}
          <div className="cover-gloss" />
        </div>
      </div>

      <h2 className="now-title">{song.title}</h2>
      <p className="now-artist">{song.artist}</p>

      <input
        type="range"
        min="0"
        max={duration || 0}
        value={progress}
        onChange={handleSeek}
        className="seek-bar-minimal"
      />
      <div className="time-row">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Transport controls live below the artwork, not on top of it */}
      <div className="transport-row">
        <button className="mini-btn" onClick={onPrev} aria-label="Previous">⏮</button>
        <button className="play-btn-main" onClick={onPlayPause} aria-label="Play/Pause">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="mini-btn" onClick={onNext} aria-label="Next">⏭</button>
      </div>
    </div>
  );
}
