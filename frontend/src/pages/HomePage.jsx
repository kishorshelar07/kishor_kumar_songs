import React, { useEffect, useState } from 'react';
import api from '../api.js';
import Player from '../components/Player.jsx';
import Navbar from '../components/Navbar.jsx';

// Fisher-Yates shuffle so the auto-play order isn't fixed every visit
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomePage() {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await api.get('/api/songs');
      setQueue(shuffle(res.data));
    } catch (err) {
      console.error('Failed to fetch songs', err);
    }
  };

  const currentSong = queue[currentIndex] || null;

  const handlePlayPause = () => {
    if (!currentSong) return;
    setIsPlaying((p) => !p);
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    setCurrentIndex((i) => (i + 1) % queue.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    setCurrentIndex((i) => (i - 1 + queue.length) % queue.length);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    handleNext();
  };

  return (
    <div className="app-bg">
      <div className="overlay" />

      {/* Decorative floating orbs + drifting notes for depth */}
      <div className="floating-layer" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
        <span className="note note-1">♪</span>
        <span className="note note-2">♫</span>
        <span className="note note-3">♪</span>
        <span className="note note-4">♫</span>
      </div>

      <Navbar />

      <div className="content">
        <span className="eyebrow">The Golden Voice</span>
        <div className="rule" />

        <main className="minimal-player-wrap">
          <Player
            song={currentSong}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
            onEnded={handleEnded}
          />
        </main>
      </div>
    </div>
  );
}
