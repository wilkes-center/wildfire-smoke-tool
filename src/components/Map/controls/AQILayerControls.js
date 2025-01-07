import React, { useState } from 'react';
import { Wind } from 'lucide-react';
import { TILESET_INFO } from '../../../utils/map/constants.js';

const AQILayerControl = ({ map, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(true);

  const toggleAQILayer = () => {
    if (!map) return;

    // Toggle visibility for all AQI layers using the correct layer IDs
    TILESET_INFO.forEach(tileset => {
      const layerId = `layer-${tileset.id}`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          isVisible ? 'none' : 'visible'
        );
      }
    });

    setIsVisible(!isVisible);
  };

  return (
    <button
      onClick={toggleAQILayer}
      className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-colors ${
        isVisible
          ? isDarkMode
            ? 'bg-blue-900/50 text-blue-400'
            : 'bg-blue-50 text-blue-600'
          : isDarkMode
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
      title="Toggle AQI layer visibility"
    >
      <Wind className="w-5 h-5" />
      <span className="font-medium">AQI Layer</span>
    </button>
  );
};

export default AQILayerControl;