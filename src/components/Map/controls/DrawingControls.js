import React from 'react';
import { Pen, X } from 'lucide-react';

export const DrawingControls = ({
  polygon,
  drawingMode,
  startDrawing,
  finishDrawing,
  clearPolygon,
  isDarkMode,
}) => {
  if (drawingMode) {
    return (
      <button
        onClick={finishDrawing}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isDarkMode
            ? 'bg-blue-900/50 hover:bg-blue-900/70 text-blue-400'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
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
            ? 'bg-blue-900/50 hover:bg-blue-900/70 text-blue-400'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
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
          ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400'
          : 'bg-red-50 hover:bg-red-100 text-red-600'
      }`}
    >
      <X className="w-5 h-5" />
      <span className="font-medium">Clear Area Selection</span>
    </button>
  );
};

export default DrawingControls;