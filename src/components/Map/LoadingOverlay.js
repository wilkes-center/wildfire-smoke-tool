import React from 'react';

const LoadingOverlay = () => (
  <div className="absolute inset-0 flex justify-center items-center bg-white/80">
    <div className="text-obsidian font-sora font-semibold">Loading map...</div>
  </div>
);

export default LoadingOverlay;
