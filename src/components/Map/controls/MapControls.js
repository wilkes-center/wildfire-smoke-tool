import React from 'react';
import { TimeControls } from './TimeControls';
import { ThemeControls } from './ThemeControls';
import { DateTime } from './DateTime';
import PM25ThresholdSlider from './PM25ThresholdSlider';
import { Pen, X } from 'lucide-react';

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
        {/* Center Controls - DateTime, Theme, and Draw */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-4">
          <PM25ThresholdSlider 
            pm25Threshold={pm25Threshold}
            setPM25Threshold={setPM25Threshold}
            isDarkMode={isDarkMode}
          />
          <DateTime
            currentDateTime={getCurrentDateTime()}
            isDarkMode={isDarkMode}
          />
          <div className="flex items-center gap-2">
            <ThemeControls
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              currentBasemap={currentBasemap}
              setCurrentBasemap={setCurrentBasemap}
              basemapOptions={basemapOptions}
            />
            {!polygon && !drawingMode && (
              <button
                onClick={startDrawing}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 text-purple-400 hover:bg-gray-700'
                    : 'bg-gray-50 text-purple-500 hover:bg-gray-100'
                }`}
                title="Draw Area"
              >
                <Pen className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
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
        />
      </div>

      {/* Drawing mode controls - Only show when in drawing mode */}
      {drawingMode && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
          <button
            onClick={finishDrawing}
            className={`h-12 px-6 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-purple-900/50 hover:bg-purple-900/70 text-purple-400'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
            }`}
          >
            Finish Drawing
          </button>
        </div>
      )}

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