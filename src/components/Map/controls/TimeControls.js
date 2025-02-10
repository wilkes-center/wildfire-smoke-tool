import React, { useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { START_DATE, END_DATE, TOTAL_HOURS } from '../../../utils/map/constants.js';

export const TimeControls = ({
  currentHour,
  setCurrentHour,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  isDarkMode
}) => {
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);

  const handlePrevHour = () => {
    const newHour = Math.max(0, currentHour - 1);
    setCurrentHour(newHour);
  };

  const handleNextHour = () => {
    const newHour = Math.min(TOTAL_HOURS - 1, currentHour + 1);
    setCurrentHour(newHour);
  };

  const handleSliderChange = (e) => {
    const newHour = parseInt(e.target.value);
    setCurrentHour(newHour);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Play/Pause Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isPlaying 
              ? isDarkMode
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : isDarkMode
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* Speed control */}
        <button
          onClick={() => setShowSpeedOptions(!showSpeedOptions)}
          className={`h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
            isDarkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          {playbackSpeed}x
        </button>

        {showSpeedOptions && (
          <div className={`absolute bottom-full mb-2 rounded-lg shadow-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            {[1, 2, 3].map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  setPlaybackSpeed(speed);
                  setShowSpeedOptions(false);
                }}
                className={`w-full px-4 py-2 text-sm transition-colors ${
                  playbackSpeed === speed
                    ? isDarkMode
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
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

      {/* Timeline */}
      <div className="flex-1 flex items-center gap-2">
        <button
          onClick={handlePrevHour}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-800 text-gray-400'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-1 h-2">
          {/* Slider background */}
          <div className={`absolute inset-0 rounded-full ${
            isDarkMode ? 'bg-gray-800' : 'bg-blue-100'
          }`} />

          {/* Slider filled portion */}
          <div 
            className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
            style={{ 
              width: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`,
              transition: 'width 0.1s ease-out'
            }}
          />

          <input
            type="range"
            min="0"
            max={TOTAL_HOURS - 1}
            value={currentHour}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 hover:[&::-webkit-slider-thumb]:scale-110"
          />
        </div>

        <button
          onClick={handleNextHour}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-800 text-gray-400'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TimeControls;