import React, { useState } from 'react';
import { Users } from 'lucide-react';

const PopulationLayerControl = ({ map, isDarkMode }) => {
  const [isActive, setIsActive] = useState(false);

  const togglePopulationLayer = () => {
    if (!map) return;

    const sourceId = 'population-source';
    const layerId = 'population-layer';

    if (isActive) {
      // Remove layer if it exists
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      // Remove source if it exists
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    } else {
      // Add source if it doesn't exist
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'vector',
          url: 'mapbox://pkulandh.crga0n6y'
        });
      }

      // Add layer if it doesn't exist
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          'source-layer': 'US-UT_pd_2020_1km_8bit-24s5pl',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'DN'],
              0, 'rgba(0,0,0,0)',
              50, '#2c3440',
              100, '#3c4959',
              150, '#4c5c73',
              200, '#5c708c',
              255, '#6b84a6'
            ],
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['get', 'DN'],
              0, 0,
              50, 0.4,
              100, 0.6,
              150, 0.8,
              200, 0.9,
              255, 1
            ],
            'fill-antialias': true
          }
        });

        // Add an outline layer for better visibility
        map.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: sourceId,
          'source-layer': 'US-UT_pd_2020_1km_8bit-24s5pl',
          paint: {
            'line-color': '#000000',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4, 0.5,
              8, 1.5
            ],
            'line-opacity': 0.3
          }
        });
      }
    }

    setIsActive(!isActive);
  };

  return (
    <button
      onClick={togglePopulationLayer}
      className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-colors ${
        isActive
          ? isDarkMode
            ? 'bg-blue-900/50 text-blue-400'
            : 'bg-blue-50 text-blue-600'
          : isDarkMode
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
      title="Toggle population density layer"
    >
      <Users className="w-5 h-5" />
      <span className="font-medium">Population Layer</span>
    </button>
  );
};

export default PopulationLayerControl;