import React from 'react';

export default function Skeleton() {
  return (
    <div className="player-minimal">
      <div className="record-stage">
        <div className="skeleton skeleton-circle" />
      </div>
      <div className="skeleton skeleton-line" style={{ width: '55%', marginTop: '1.4rem' }} />
      <div className="skeleton skeleton-line" style={{ width: '35%' }} />
      <div
        className="skeleton skeleton-line"
        style={{ width: '100%', maxWidth: 220, height: 6, marginTop: '0.8rem' }}
      />
    </div>
  );
}
