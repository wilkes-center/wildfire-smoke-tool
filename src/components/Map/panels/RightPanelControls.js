import React, { useState, useEffect } from 'react';

import AreaAnalysis from './AreaAnalysis';
import MapAdditionalControls from './MapAdditionalControls';

/**
 * Right panel controls with text buttons and panels that open below
 */
const RightPanelControls = ({
  map,
  mapStyle,
  mapboxAccessToken,
  polygon,
  currentDateTime,
  isDarkMode,
  pm25Threshold,
  isPlaying
}) => {
  const [showAreaStats, setShowAreaStats] = useState(false);
  const [showAreaOverview, setShowAreaOverview] = useState(false);

  // Auto-expand panels when polygon exists, close when polygon is cleared
  useEffect(() => {
    if (polygon) {
      setShowAreaStats(true);
      setShowAreaOverview(true);
    } else {
      setShowAreaStats(false);
      setShowAreaOverview(false);
    }
  }, [polygon]);

  return (
    <div className="flex flex-col gap-2">
      {/* Control Buttons - Always Visible */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowAreaStats(!showAreaStats)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm shadow-lg border-2 ${
            showAreaStats
              ? isDarkMode
                ? 'bg-forest/90 text-gold-light border-gold-light'
                : 'bg-forest/90 text-cream border-cream'
              : isDarkMode
                ? 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-200 border-white hover:border-gold-light'
                : 'bg-white/90 hover:bg-gray-50/90 text-gray-800 border-mahogany hover:border-forest'
          }`}
        >
          Area Statistics
        </button>

        <button
          onClick={() => setShowAreaOverview(!showAreaOverview)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm shadow-lg border-2 ${
            showAreaOverview
              ? isDarkMode
                ? 'bg-forest/90 text-gold-light border-gold-light'
                : 'bg-forest/90 text-cream border-cream'
              : isDarkMode
                ? 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-200 border-white hover:border-gold-light'
                : 'bg-white/90 hover:bg-gray-50/90 text-gray-800 border-mahogany hover:border-forest'
          }`}
        >
          Area Overview
        </button>
      </div>

      {/* Panels - Open Below Buttons */}
      <div className="flex flex-col gap-2">
        {showAreaStats && (
          <div className="w-[480px]">
            <AreaAnalysis
              map={map}
              currentDateTime={currentDateTime}
              isPlaying={isPlaying}
              polygon={polygon}
              isDarkMode={isDarkMode}
              onExpandChange={() => {}}
              forceExpanded={true}
            />
          </div>
        )}

        {showAreaOverview && (
          <div className="w-[480px]">
            <MapAdditionalControls
              map={map}
              mapStyle={mapStyle}
              mapboxAccessToken={mapboxAccessToken}
              polygon={polygon}
              currentDateTime={currentDateTime}
              isDarkMode={isDarkMode}
              pm25Threshold={pm25Threshold}
              onExpandChange={() => {}}
              isPlaying={isPlaying}
              forceExpanded={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanelControls;
