import React from 'react';
import { TimeControls } from './TimeControls';
import { ThemeControls } from './ThemeControls';
import { DateTime } from './DateTime';
import PM25ThresholdSlider from './PM25ThresholdSlider';
import { Pen, X } from 'lucide-react';
import { TILESET_INFO } from '../../../utils/map/constants.js';

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
  setPM25Threshold
}) => {
  const dateTime = getCurrentDateTime ? getCurrentDateTime() : { date: '', hour: 0 };

  return (
    <div className="relative w-full h-full pointer-events-none">
      {/* Top Controls Container */}
      <div className="fixed top-4 inset-x-4 z-50">
        {/* Left Controls - PM25 Threshold */}
        <div className="absolute left-4 pointer-events-auto">
          <PM25ThresholdSlider 
            pm25Threshold={pm25Threshold}
            setPM25Threshold={setPM25Threshold}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Top Center Controls Row */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 pointer-events-auto">
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
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm shadow-lg border-2 border-mahogany ${
              isDarkMode
                ? 'bg-white/90 text-mahogany hover:bg-white/80'
                : 'bg-white/90 text-mahogany hover:bg-white/80'
            }`}
            title="Draw Area"
          >
            <Pen className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom Time Controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl pointer-events-auto">
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
                  mapInstance.setPaintProperty(layerId, 'circle-opacity', isDarkMode ? 0.6 : 0.4);
                  mapInstance.setLayoutProperty(layerId, 'visibility', 'visible');
                } else {
                  console.warn(`Layer not found for time ${timeString}:`, layerId);
                }
              }
            }
          }}
        />
      </div>

      {/* Clear button - Only show when area is selected */}
      {polygon && !drawingMode && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
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
        </div>
      )}
    </div>
  );
};

export default MapControls;