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
    <div className="fixed left-4 bottom-4 z-50">
      <div className={`flex flex-col items-center gap-1 p-1 rounded-lg backdrop-blur-md ${
        isDarkMode 
          ? 'bg-gray-900/90 border border-forest/30' 
          : 'bg-white/90 border border-forest/20'
      }`}>
        <button
          onClick={handleZoomIn}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'hover:bg-forest/20 text-gold' 
              : 'hover:bg-sage-light text-forest'
          }`}
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        <div className={`text-sm font-medium px-2 py-1 rounded-md ${
          isDarkMode 
            ? 'bg-forest/10 text-gold' 
            : 'bg-sage-light text-forest'
        }`}>
          {map ? Math.round(map.getZoom() * 10) / 10 : '0.0'}
        </div>
        
        <button
          onClick={handleZoomOut}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'hover:bg-forest/20 text-gold' 
              : 'hover:bg-sage-light text-forest'
          }`}
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className={`w-full h-px ${isDarkMode ? 'bg-forest/20' : 'bg-sage'}`} />

        <button
          onClick={handleReset}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'hover:bg-forest/20 text-gold' 
              : 'hover:bg-sage-light text-forest'
          }`}
          aria-label="Reset map view"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ZoomControls;