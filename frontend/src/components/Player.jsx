import React, { useRef, useEffect, useState } from 'react';
import { useFavorites } from '../context/FavoritesContext.jsx';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function Player({
  song,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onEnded,
  shuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat
}) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showLyrics, setShowLyrics] = useState(false);
  const touchStartX = useRef(null);

  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, song]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Reset displayed time + close lyrics whenever a different song loads
  useEffect(() => {
    setProgress(0);
    setDuration(0);
    setShowLyrics(false);
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

  // "Repeat one" is handled locally — just replay the same file — so the
  // parent's queue-advance logic doesn't need to know about it.
  const handleEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }
    onEnded();
  };

  // Basic swipe support for mobile — swipe left/right on the artwork to
  // skip tracks, matching the on-screen prev/next buttons.
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 50;
    if (deltaX > SWIPE_THRESHOLD) onPrev();
    else if (deltaX < -SWIPE_THRESHOLD) onNext();
    touchStartX.current = null;
  };

  if (!song) {
    return (
      <div className="player-minimal">
        <p className="empty-msg">No songs yet. Ask the admin to add some.</p>
      </div>
    );
  }

  const coverUrl = song.coverImage || null;
  const audioUrl = song.audioFile;
  const favorited = isFavorite(song._id);

  return (
    <div className="player-minimal">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div
        className="record-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`cover-wrap${isPlaying ? ' spinning' : ''}`}>
          {coverUrl ? (
            <img src={coverUrl} alt={song.title} className="cover-img" />
          ) : (
            <div className="cover-placeholder">🎵</div>
          )}
          <div className="cover-gloss" />
        </div>
      </div>

      <div className="title-row">
        <div>
          <h2 className="now-title">{song.title}</h2>
          <p className="now-artist">{song.artist}</p>
        </div>
        <button
          className={`fav-heart-btn${favorited ? ' active' : ''}`}
          onClick={() => toggleFavorite(song._id)}
          aria-label="Toggle favorite"
        >
          ♥
        </button>
      </div>

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

      <div className="transport-row">
        <button
          className={`mini-btn toggle-btn${shuffle ? ' active' : ''}`}
          onClick={onToggleShuffle}
          aria-label="Toggle shuffle"
          title="Shuffle"
        >
          🔀
        </button>
        <button className="mini-btn" onClick={onPrev} aria-label="Previous">⏮</button>
        <button className="play-btn-main" onClick={onPlayPause} aria-label="Play/Pause">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="mini-btn" onClick={onNext} aria-label="Next">⏭</button>
        <button
          className={`mini-btn toggle-btn${repeatMode !== 'off' ? ' active' : ''}`}
          onClick={onCycleRepeat}
          aria-label="Cycle repeat mode"
          title={`Repeat: ${repeatMode}`}
        >
          {repeatMode === 'one' ? '🔂' : '🔁'}
        </button>
      </div>

      <div className="volume-row">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="volume-bar"
        />
      </div>

      {song.lyrics && (
        <div className="lyrics-section">
          <button className="lyrics-toggle-btn" onClick={() => setShowLyrics((v) => !v)}>
            {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
          </button>
          {showLyrics && <pre className="lyrics-text">{song.lyrics}</pre>}
        </div>
      )}
    </div>
  );
}
