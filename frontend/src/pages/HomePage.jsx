import React, { useEffect, useState, useCallback } from 'react';
import api from '../api.js';
import Player from '../components/Player.jsx';
import Navbar from '../components/Navbar.jsx';
import SongListDrawer from '../components/SongListDrawer.jsx';
import Skeleton from '../components/Skeleton.jsx';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts.js';
import { useTheme } from '../context/ThemeContext.jsx';

export default function HomePage() {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/songs');
      setQueue(res.data);
    } catch (err) {
      console.error('Failed to fetch songs', err);
    } finally {
      setLoading(false);
    }
  };

  const currentSong = queue[currentIndex] || null;

  const handlePlayPause = useCallback(() => {
    setIsPlaying((p) => (queue.length === 0 ? false : !p));
  }, [queue.length]);

  // isAuto=true means this came from a song naturally ending (onEnded),
  // as opposed to the user pressing the Next button manually.
  const handleNext = useCallback(
    (isAuto = false) => {
      if (queue.length === 0) return;

      if (shuffle) {
        if (queue.length === 1) {
          setIsPlaying(true);
          return;
        }
        let idx;
        do {
          idx = Math.floor(Math.random() * queue.length);
        } while (idx === currentIndex);
        setCurrentIndex(idx);
        setIsPlaying(true);
        return;
      }

      const atEnd = currentIndex === queue.length - 1;
      if (atEnd && repeatMode === 'off' && isAuto) {
        // Reached the end of the list naturally, and repeat is off — stop.
        setIsPlaying(false);
        return;
      }

      setCurrentIndex((i) => (i + 1) % queue.length);
      setIsPlaying(true);
    },
    [queue.length, shuffle, currentIndex, repeatMode]
  );

  const handlePrev = useCallback(() => {
    if (queue.length === 0) return;
    setCurrentIndex((i) => (i - 1 + queue.length) % queue.length);
    setIsPlaying(true);
  }, [queue.length]);

  const handleEnded = useCallback(() => {
    handleNext(true);
  }, [handleNext]);

  const handleSelectFromDrawer = (song) => {
    const idx = queue.findIndex((s) => s._id === song._id);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setIsPlaying(true);
    }
    setDrawerOpen(false);
  };

  const cycleRepeat = () => {
    setRepeatMode((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'));
  };

  useKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onNext: () => handleNext(false),
    onPrev: handlePrev
  });

  return (
    <div className="app-bg">
      <div className="overlay" />

      <div className="floating-layer" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
        <span className="note note-1">♪</span>
        <span className="note note-2">♫</span>
        <span className="note note-3">♪</span>
        <span className="note note-4">♫</span>
      </div>

      <Navbar
        onOpenDrawer={() => setDrawerOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="content">
        <span className="eyebrow">The Golden Voice</span>
        <div className="rule" />

        <main className="minimal-player-wrap">
          {loading ? (
            <Skeleton />
          ) : (
            <Player
              song={currentSong}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={() => handleNext(false)}
              onPrev={handlePrev}
              onEnded={handleEnded}
              shuffle={shuffle}
              onToggleShuffle={() => setShuffle((s) => !s)}
              repeatMode={repeatMode}
              onCycleRepeat={cycleRepeat}
            />
          )}
        </main>
      </div>

      <SongListDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        songs={queue}
        onSelect={handleSelectFromDrawer}
        currentSongId={currentSong?._id}
      />
    </div>
  );
}
