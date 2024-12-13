import React from 'react';
import { TimeControls } from './TimeControls';
import { ThemeControls } from './ThemeControls';
import { AQIControls } from './AQIControls';
import { DrawingControls } from './DrawingControls';
import { DateTime } from './DateTime';

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
  basemapOptions
}) => {
  return (
    <div className="relative w-full h-full pointer-events-none">
      {/* Top Left Controls */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-auto">
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

      {/* Center DateTime - New Position */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <DateTime
          currentDateTime={getCurrentDateTime()}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl pointer-events-auto">
        <div className={`backdrop-blur-sm rounded-xl shadow-lg border ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-700' 
            : 'bg-white/95 border-gray-100'
        }`}>
          <div className="px-4 py-3">
            <div className="flex items-center gap-4">
              <TimeControls
                currentHour={currentHour}
                setCurrentHour={setCurrentHour}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                isDarkMode={isDarkMode}
              />

              <DrawingControls
                polygon={polygon}
                drawingMode={drawingMode}
                startDrawing={startDrawing}
                finishDrawing={finishDrawing}
                clearPolygon={clearPolygon}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapControls;