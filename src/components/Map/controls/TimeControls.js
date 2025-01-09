import React, { useState, useEffect } from 'react';
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
    console.log('TimeControls - handlePrevHour - before:', currentHour);
    const newHour = Math.max(0, currentHour - 1);
    console.log('TimeControls - handlePrevHour - setting to:', newHour);
    setCurrentHour(newHour);
  };

  const handleNextHour = () => {
    console.log('TimeControls - handleNextHour - before:', currentHour);
    const newHour = Math.min(TOTAL_HOURS - 1, currentHour + 1);
    console.log('TimeControls - handleNextHour - setting to:', newHour);
    setCurrentHour(newHour);
  };

  const handleSliderChange = (e) => {
    console.log('TimeControls - handleSliderChange - before:', currentHour);
    const newHour = parseInt(e.target.value);
    console.log('TimeControls - handleSliderChange - setting to:', newHour);
    setCurrentHour(newHour);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Play/Pause Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isPlaying 
              ? isDarkMode
                ? 'bg-red-900/50 hover:bg-red-900/70 text-red-400'
                : 'bg-red-50 hover:bg-red-100 text-red-600'
              : isDarkMode
                ? 'bg-green-900/50 hover:bg-green-900/70 text-green-400'
                : 'bg-green-50 hover:bg-green-100 text-green-600'
          }`}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* Speed control */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedOptions(!showSpeedOptions)}
            className={`h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            {playbackSpeed}x
          </button>

          {showSpeedOptions && (
            <div className={`absolute bottom-full left-0 mb-2 rounded-lg shadow-lg border ${
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
                        ? 'bg-blue-900/50 text-blue-400'
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
      </div>

      {/* Timeline */}
      <div className="flex-1 flex items-center gap-2">
        <button
          onClick={handlePrevHour}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/*Timeline range - handle Slider Change*/}
        <div className="flex-1 h-2 relative">
          <input
            type="range"
            min="0"
            max={TOTAL_HOURS - 1}
            value={currentHour}
            onChange={handleSliderChange}
            className={`w-full h-2 rounded-full appearance-none cursor-pointer ${
              isDarkMode ? 'bg-gray-700' : 'bg-blue-100'
            }`}
            style={{
              backgroundImage: `linear-gradient(to right, ${
                isDarkMode ? '#60A5FA' : '#3B82F6'
              } ${(currentHour / (TOTAL_HOURS - 1)) * 100}%, ${
                isDarkMode ? '#374151' : '#EFF6FF'
              } ${(currentHour / (TOTAL_HOURS - 1)) * 100}%)`
            }}
          />
        </div>

        <button
          onClick={handleNextHour}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};