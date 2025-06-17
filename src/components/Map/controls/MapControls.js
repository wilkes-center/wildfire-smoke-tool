import React from 'react';

import { Pen, X } from 'lucide-react';

import { TILESET_INFO } from '../../../utils/map/constants.js';

import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { DateTime } from './DateTime';
import { ThemeControls } from './ThemeControls';
import { TimeControls } from './TimeControls';

const MapControls = ({
  currentHour,
  setCurrentHour,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  getCurrentDateTime,
  drawingMode,
  startDrawing,
  finishDrawing,
  clearPolygon,
  polygon,
  isDarkMode,
  setIsDarkMode,
  currentBasemap,
  setCurrentBasemap,
  basemapOptions,
  mapInstance,
  pm25Threshold,
  setPM25Threshold,
  setDrawingMode,
  setTempPolygon
}) => {
  const dateTime = getCurrentDateTime ? getCurrentDateTime() : { date: '', hour: 0 };

  return (
    <div className="relative w-full h-full pointer-events-none">
      {/* Top Controls Container */}
      <div className="fixed top-4 inset-x-4 z-50">
        {/* No left controls here anymore - moved to MapComponent */}
      </div>

      {/* Top Center Controls Row */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Main Controls Row */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Control (Left of DateTime) */}
          <ThemeControls
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            currentBasemap={currentBasemap}
            setCurrentBasemap={setCurrentBasemap}
            basemapOptions={basemapOptions}
          />

          {/* Centered DateTime */}
          <DateTime currentDateTime={getCurrentDateTime()} isDarkMode={isDarkMode} />

          {/* Draw Button (Right of DateTime) */}
          {!polygon && !drawingMode && (
            <button
              onClick={startDrawing}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors backdrop-blur-sm shadow-lg border-2 border-mahogany ${
                isDarkMode
                  ? 'bg-white/90 text-mahogany hover:bg-white/80'
                  : 'bg-white/90 text-mahogany hover:bg-white/80'
              }`}
              title="Draw Area"
            >
              <Pen className="w-5 h-5" />
              <span className="font-medium" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                Draw Area
              </span>
            </button>
          )}

          {polygon && !drawingMode && (
            <button
              onClick={clearPolygon}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors backdrop-blur-sm shadow-lg border-2 ${
                isDarkMode
                  ? 'bg-red-900/90 hover:bg-red-900/80 text-red-400 border-red-400'
                  : 'bg-red-50/90 hover:bg-red-100/90 text-red-600 border-red-600'
              }`}
              title="Clear Area Selection"
            >
              <X className="w-5 h-5" />
              <span className="font-medium" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                Clear Area
              </span>
            </button>
          )}

          {/* Cancel Drawing Button (Right of DateTime) */}
          {drawingMode && (
            <button
              onClick={() => {
                // Cancel drawing and clear temporary polygon
                setDrawingMode(false);
                setTempPolygon([]);
                if (mapInstance) {
                  mapInstance.getCanvas().style.cursor = '';
                }
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors backdrop-blur-sm shadow-lg border-2 ${
                isDarkMode
                  ? 'bg-gray-700/90 hover:bg-gray-600/90 text-gray-300 border-gray-400'
                  : 'bg-gray-100/90 hover:bg-gray-200/90 text-gray-700 border-gray-500'
              }`}
              title="Cancel Drawing"
            >
              <X className="w-5 h-5" />
              <span className="font-medium" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                Cancel
              </span>
            </button>
          )}
        </div>

        {/* Current Time Indicator - Under DateTime */}
        <CurrentTimeIndicator currentHour={currentHour} isDarkMode={isDarkMode} />
      </div>

      {/* Bottom Time Controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl pointer-events-auto">
        <TimeControls
          currentHour={currentHour}
          setCurrentHour={setCurrentHour}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          isDarkMode={isDarkMode}
          onTimeChange={hour => {
            // Force an immediate layer update when time is changed manually
            if (mapInstance && mapInstance.getStyle()) {
              try {
                const { date, hour: newHour } = getCurrentDateTime(hour);
                const currentTileset = TILESET_INFO.find(
                  tileset =>
                    tileset.date === date &&
                    newHour >= tileset.startHour &&
                    newHour <= tileset.endHour
                );

                // Get all layer IDs that start with 'layer-' using a more reliable method
                const allLayers = [];
                try {
                  const style = mapInstance.getStyle();
                  if (style && style.layers) {
                    style.layers.forEach(layer => {
                      if (layer.id && layer.id.startsWith('layer-')) {
                        allLayers.push(layer.id);
                      }
                    });
                  }
                } catch (layerError) {
                  console.warn('Error getting layers, trying alternative method:', layerError);
                  // Alternative method: use TILESET_INFO to construct layer IDs
                  TILESET_INFO.forEach(tileset => {
                    allLayers.push(`layer-${tileset.id}`);
                  });
                }

                // Hide all layers first
                allLayers.forEach(layerId => {
                  try {
                    if (mapInstance.getLayer(layerId)) {
                      mapInstance.setLayoutProperty(layerId, 'visibility', 'none');
                    }
                  } catch (hideError) {
                    console.warn(`Error hiding layer ${layerId}:`, hideError);
                  }
                });

                if (currentTileset) {
                  const layerId = `layer-${currentTileset.id}`;
                  const timeString = `${date}T${String(newHour).padStart(2, '0')}:00:00`;

                  // Make sure the layer exists
                  if (mapInstance.getLayer(layerId)) {
                    try {
                      // Update filter for the specific hour
                      mapInstance.setFilter(layerId, [
                        'all',
                        ['==', ['get', 'time'], timeString],
                        ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
                      ]);

                      // Make layer visible
                      mapInstance.setLayoutProperty(layerId, 'visibility', 'visible');
                      console.log(`Successfully updated layer ${layerId} for time ${timeString}`);
                    } catch (layerError) {
                      console.error(`Error updating layer ${layerId}:`, layerError);
                    }
                  } else {
                    console.warn(`Layer not found for time ${timeString}:`, layerId);
                  }
                } else {
                  // Fallback: use the last available tileset if no current tileset found
                  console.warn(`No tileset found for time ${newHour}, falling back to last available data`);
                  const lastTileset = TILESET_INFO[TILESET_INFO.length - 1];
                  if (lastTileset) {
                    const fallbackLayerId = `layer-${lastTileset.id}`;
                    const fallbackHour = lastTileset.endHour;
                    const fallbackTimeString = `${lastTileset.date}T${String(fallbackHour).padStart(2, '0')}:00:00`;

                    // Show fallback layer if it exists
                    if (mapInstance.getLayer(fallbackLayerId)) {
                      try {
                        mapInstance.setFilter(fallbackLayerId, [
                          'all',
                          ['==', ['get', 'time'], fallbackTimeString],
                          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
                        ]);
                        mapInstance.setLayoutProperty(fallbackLayerId, 'visibility', 'visible');
                        console.log(`Showing fallback layer ${fallbackLayerId} with time ${fallbackTimeString}`);
                      } catch (fallbackError) {
                        console.error(`Error showing fallback layer ${fallbackLayerId}:`, fallbackError);
                      }
                    } else {
                      console.warn(`Fallback layer not found: ${fallbackLayerId}`);
                    }
                  }
                }
              } catch (error) {
                console.error('Error in onTimeChange callback:', error);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default MapControls;
