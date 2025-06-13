import React from 'react';

import { Pen, X } from 'lucide-react';

export const DrawingControls = ({
  polygon,
  drawingMode,
  startDrawing,
  finishDrawing,
  clearPolygon,
  isDarkMode
}) => {
  if (drawingMode) {
    return (
      <button
        onClick={finishDrawing}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isDarkMode
            ? 'bg-forest-dark/50 hover:bg-forest/70 text-gold'
            : 'bg-sage-light hover:bg-sage text-forest-dark'
        }`}
      >
        Finish Drawing
      </button>
    );
  }

  if (!polygon) {
    return (
      <button
        onClick={startDrawing}
        className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-colors ${
          isDarkMode
            ? 'bg-forest-dark/50 hover:bg-forest/70 text-gold'
            : 'bg-sage-light hover:bg-sage text-forest-dark'
        }`}
      >
        <Pen className="w-5 h-5" />
        <span className="font-medium">Draw Area</span>
      </button>
    );
  }

  return (
    <button
      onClick={clearPolygon}
      className={`h-12 px-6 rounded-lg flex items-center gap-2 transition-colors ${
        isDarkMode
          ? 'bg-rust-dark/20 hover:bg-rust/30 text-gold-light'
          : 'bg-rust-light/20 hover:bg-rust-light/30 text-rust-dark'
      }`}
    >
      <X className="w-5 h-5" />
      <span className="font-medium">Clear Area Selection</span>
    </button>
  );
};

export default DrawingControls;
