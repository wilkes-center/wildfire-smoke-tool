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
          <DateTime
            currentDateTime={getCurrentDateTime()}
            isDarkMode={isDarkMode}
          />

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
              <span className="font-medium">Draw Area</span>
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
              <span className="font-medium">Clear Area</span>
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
              <span className="font-medium">Cancel</span>
            </button>
          )}
        </div>

        {/* Current Time Indicator - Under DateTime */}
        <CurrentTimeIndicator
          currentHour={currentHour}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Bottom Time Controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl pointer-events-auto">
      <TimeControls
          currentHour={currentHour}
          setCurrentHour={setCurrentHour}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          isDarkMode={isDarkMode}
          onTimeChange={(hour) => {
            // Force an immediate layer update when time is changed manually
            if (mapInstance) {
              const { date, hour: newHour } = getCurrentDateTime(hour);
              const currentTileset = TILESET_INFO.find(tileset =>
                tileset.date === date &&
                newHour >= tileset.startHour &&
                newHour <= tileset.endHour
              );

              if (currentTileset) {
                const layerId = `layer-${currentTileset.id}`;
                const timeString = `${date}T${String(newHour).padStart(2, '0')}:00:00`;

                // Hide all layers first
                Object.values(mapInstance.getStyle().layers)
                  .filter(layer => layer.id.startsWith('layer-'))
                  .forEach(layer => {
                    mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
                    mapInstance.setPaintProperty(layer.id, 'circle-opacity', 0);
                  });

                // Make sure the layer exists
                if (mapInstance.getLayer(layerId)) {
                  // Update filter for the specific hour
                  mapInstance.setFilter(layerId, [
                    'all',
                    ['==', ['get', 'time'], timeString],
                    ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
                  ]);

                  // Make layer visible
                  mapInstance.setLayoutProperty(layerId, 'visibility', 'visible');
                } else {
                  console.warn(`Layer not found for time ${timeString}:`, layerId);
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default MapControls;
