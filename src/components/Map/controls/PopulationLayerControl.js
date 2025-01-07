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
              0, 'rgba(240,240,240,0)',
              50, '#fee8c8',
              100, '#fdbb84',
              150, '#fc8d59',
              200, '#ef6548',
              255, '#d7301f'
            ],
            'fill-opacity': 1
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