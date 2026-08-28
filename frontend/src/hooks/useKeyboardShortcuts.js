import { useEffect } from 'react';

export default function useKeyboardShortcuts({ onPlayPause, onNext, onPrev }) {
  useEffect(() => {
    const handler = (e) => {
      // Don't hijack keys while the user is typing in a form field
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        onPlayPause();
      } else if (e.code === 'ArrowRight') {
        onNext();
      } else if (e.code === 'ArrowLeft') {
        onPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPlayPause, onNext, onPrev]);
}
