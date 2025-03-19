import React, { useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { TOTAL_HOURS } from '../../../utils/map/constants.js';

export const TimeControls = ({
  currentHour,
  setCurrentHour,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  isDarkMode,
  onTimeChange
}) => {
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);

  const handlePrevHour = () => {
    const newHour = Math.max(0, currentHour - 1);
    setCurrentHour(newHour);
    if (onTimeChange) onTimeChange(newHour);
  };

  const handleNextHour = () => {
    const newHour = Math.min(TOTAL_HOURS - 1, currentHour + 1);
    setCurrentHour(newHour);
    if (onTimeChange) onTimeChange(newHour);
  };

  const handleSliderChange = (e) => {
    const newHour = parseInt(e.target.value);
    setCurrentHour(newHour);
    if (onTimeChange) onTimeChange(newHour);
  };

  const dateMarkers = [24, 48, 72].map(hour => ({
    hour,
    position: (hour / (TOTAL_HOURS - 1)) * 100
  }));

  return (
    <div className={`backdrop-blur-md rounded-xl border shadow-lg px-6 py-4 ${
      isDarkMode 
        ? 'bg-gray-900/95 border-purple-500/30' 
        : 'bg-white/95 border-purple-500/20'
    }`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              isDarkMode
                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSpeedOptions(!showSpeedOptions)}
            className={`h-10 px-4 rounded-lg text-sm font-medium transition-all ${
              isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-purple-300'
                : 'bg-gray-100 hover:bg-gray-200 text-purple-600'
            }`}
          >
            {playbackSpeed}x
          </button>

          {showSpeedOptions && (
            <div className={`absolute bottom-full mb-2 rounded-lg shadow-lg border ${
              isDarkMode ? 'bg-gray-800 border-purple-500/30' : 'bg-white border-purple-500/20'
            }`}>
              {[1, 2, 3].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackSpeed(speed);
                    setShowSpeedOptions(false);
                  }}
                  className={`w-full px-4 py-2 text-sm transition-all ${
                    playbackSpeed === speed
                      ? isDarkMode
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-purple-100 text-purple-600'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center gap-2">
          <button
            onClick={handlePrevHour}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-purple-400'
                : 'hover:bg-gray-100 text-purple-500'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <div 
              className={`absolute -top-8 py-1 px-2 rounded-lg text-sm font-medium transform -translate-x-1/2 ${
                isDarkMode 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-purple-500 text-white'
              }`}
              style={{ 
                left: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`,
              }}
            >
              {String(currentHour % 24).padStart(2, '0')}:00 UTC
            </div>

            <div 
              className={`absolute h-8 w-0.5 -translate-x-1/2 ${
                isDarkMode ? 'bg-purple-400' : 'bg-purple-500'
              }`}
              style={{ 
                left: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`,
                top: '-8px'
              }}
            />

            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 pointer-events-none">
              {dateMarkers.map((marker, index) => (
                <div
                  key={index}
                  className={`absolute w-0.5 h-3 -translate-y-1 ${
                    isDarkMode ? 'bg-purple-400' : 'bg-purple-500'
                  }`}
                  style={{ left: `${marker.position}%` }}
                />
              ))}
            </div>

            <div className={`absolute h-0.5 w-full top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`} />

            <div 
              className={`absolute h-0.5 left-0 top-1/2 -translate-y-1/2 transition-all ${
                isDarkMode ? 'bg-purple-500' : 'bg-purple-500'
              }`}
              style={{ 
                width: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`,
              }}
            />

            <input
              type="range"
              min="0"
              max={TOTAL_HOURS - 1}
              value={currentHour}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 hover:[&::-webkit-slider-thumb]:scale-110 transition-transform"
            />
          </div>

          <button
            onClick={handleNextHour}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-purple-400'
                : 'hover:bg-gray-100 text-purple-500'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeControls;