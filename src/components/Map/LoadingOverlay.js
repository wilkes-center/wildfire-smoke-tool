import React from 'react';

const LoadingOverlay = ({ isDarkMode }) => (
  <div className="absolute inset-0 flex justify-center items-center bg-white">
    <div className="text-obsidian font-sora font-medium text-sm opacity-70">
      Initializing map...
    </div>
  </div>
);

export default LoadingOverlay;
