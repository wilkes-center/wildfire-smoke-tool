import React from 'react';
import { TimeControls } from './TimeControls';
import { ThemeControls } from './ThemeControls';
import { AQIControls } from './AQIControls';
import { DrawingControls } from './DrawingControls';
import { DateTime } from './DateTime';

const DEFAULT_VIEW = {
  center: [-98.5795, 39.8283],
  zoom: 4,
  duration: 1000
};

const MapControls = ({
  currentHour,
  setCurrentHour,
  aqiThreshold,
  setAqiThreshold,
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
  mapInstance  // Now properly used
}) => {
  const dateTime = getCurrentDateTime ? getCurrentDateTime() : { date: '', hour: 0 };

  const handleResetView = () => {
    if (mapInstance) {
      // Using flyTo instead of setViewport for smooth transition
      mapInstance.flyTo({
        center: DEFAULT_VIEW.center,
        zoom: DEFAULT_VIEW.zoom,
        duration: DEFAULT_VIEW.duration
      });
    }
  };

  return (
    <div className="relative w-full h-full pointer-events-none">
      {/* Top Controls Container */}
      <div className="fixed top-4 inset-x-4 z-50 flex justify-between items-start gap-4">
        {/* Left Controls Stack */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <ThemeControls
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            currentBasemap={currentBasemap}
            setCurrentBasemap={setCurrentBasemap}
            basemapOptions={basemapOptions}
          />
          
          <AQIControls
            aqiThreshold={aqiThreshold}
            setAqiThreshold={setAqiThreshold}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Center Controls - DateTime */}
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2">
          <DateTime
            currentDateTime={getCurrentDateTime()}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Bottom Controls Container */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl pointer-events-auto">
        <div className={`backdrop-blur-md rounded-2xl shadow-lg ${
          isDarkMode 
            ? 'bg-gray-900/90 border border-gray-800' 
            : 'bg-white/90 border border-gray-100'
        }`}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <TimeControls
                  currentHour={currentHour}
                  setCurrentHour={setCurrentHour}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  playbackSpeed={playbackSpeed}
                  setPlaybackSpeed={setPlaybackSpeed}
                  isDarkMode={isDarkMode}
                />
              </div>

              <div className="flex-shrink-0">
                <DrawingControls
                  polygon={polygon}
                  drawingMode={drawingMode}
                  startDrawing={startDrawing}
                  finishDrawing={finishDrawing}
                  clearPolygon={clearPolygon}
                  isDarkMode={isDarkMode}
                  onResetView={handleResetView}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapControls;