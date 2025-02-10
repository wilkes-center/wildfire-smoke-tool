import React from 'react';
import { Plus, Minus, Compass } from 'lucide-react';

const ZoomControls = ({ map, isDarkMode }) => {
  const handleZoomIn = () => {
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut();
    }
  };

  const handleReset = () => {
    if (map) {
      map.flyTo({
        center: [-98.5795, 39.8283],
        zoom: 4,
        bearing: 0,
        pitch: 0,
        duration: 1500
      });
    }
  };

  return (
    <div className="fixed left-4 bottom-4 z-50 flex flex-col items-center">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1 ${
        isDarkMode 
          ? 'bg-gray-900/70 text-gray-300' 
          : 'bg-white/70 text-gray-600'
      } backdrop-blur-sm shadow-lg`}>
        {map ? Math.round(map.getZoom() * 10) / 10 : '0.0'}
      </div>
      
      <button
        onClick={handleZoomIn}
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1 ${
          isDarkMode 
            ? 'bg-gray-900/70 hover:bg-gray-800/70 text-gray-300' 
            : 'bg-white/70 hover:bg-gray-50/70 text-gray-600'
        } backdrop-blur-sm shadow-lg transition-colors`}
        aria-label="Zoom in"
      >
        <Plus className="w-5 h-5" />
      </button>
      
      <button
        onClick={handleZoomOut}
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1 ${
          isDarkMode 
            ? 'bg-gray-900/70 hover:bg-gray-800/70 text-gray-300' 
            : 'bg-white/70 hover:bg-gray-50/70 text-gray-600'
        } backdrop-blur-sm shadow-lg transition-colors`}
        aria-label="Zoom out"
      >
        <Minus className="w-5 h-5" />
      </button>

      <button
        onClick={handleReset}
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isDarkMode 
            ? 'bg-gray-900/70 hover:bg-gray-800/70 text-gray-300' 
            : 'bg-white/70 hover:bg-gray-50/70 text-gray-600'
        } backdrop-blur-sm shadow-lg transition-colors`}
        aria-label="Reset map view"
      >
        <Compass className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ZoomControls;