import { Pen, X } from 'lucide-react';
import React from 'react';

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
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-4">
          <ThemeControls
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            currentBasemap={currentBasemap}
            setCurrentBasemap={setCurrentBasemap}
            basemapOptions={basemapOptions}
          />
          <DateTime currentDateTime={getCurrentDateTime()} isDarkMode={isDarkMode} />
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
        <CurrentTimeIndicator currentHour={currentHour} isDarkMode={isDarkMode} />
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl pointer-events-auto">
        <TimeControls
          currentHour={currentHour}
          setCurrentHour={setCurrentHour}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          isDarkMode={isDarkMode}
          onTimeChange={hour => {
            if (mapInstance) {
              const { date, hour: newHour } = getCurrentDateTime(hour);
              const currentTileset = TILESET_INFO.find(
                tileset =>
                  tileset.date === date &&
                  newHour >= tileset.startHour &&
                  newHour <= tileset.endHour
              );

              if (currentTileset) {
                const layerId = `layer-${currentTileset.id}`;
                const timeString = `${date}T${String(newHour).padStart(2, '0')}:00:00`;

                Object.values(mapInstance.getStyle().layers)
                  .filter(layer => layer.id.startsWith('layer-'))
                  .forEach(layer => {
                    mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
                    mapInstance.setPaintProperty(layer.id, 'circle-opacity', 0);
                  });

                if (mapInstance.getLayer(layerId)) {
                  mapInstance.setFilter(layerId, [
                    'all',
                    ['==', ['get', 'time'], timeString],
                    ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
                  ]);

                  mapInstance.setPaintProperty(layerId, 'circle-opacity', isDarkMode ? 0.6 : 0.4);
                  mapInstance.setLayoutProperty(layerId, 'visibility', 'visible');
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
