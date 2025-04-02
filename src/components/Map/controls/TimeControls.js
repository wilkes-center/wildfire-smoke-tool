import React, { useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { TOTAL_HOURS, START_DATE } from '../../../utils/map/constants.js';

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

  // Generate dates for each day
  const generateDateLabel = (dayOffset) => {
    const date = new Date(START_DATE);
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Position day markers at the start of each day (0, 24, 48, 72 hours)
  const dayMarkerPositions = [
    { label: generateDateLabel(0), hour: 0 },
    { label: generateDateLabel(1), hour: 24 },
    { label: generateDateLabel(2), hour: 48 },
    { label: generateDateLabel(3), hour: 72 }
  ].map(marker => ({
    ...marker,
    position: (marker.hour / (TOTAL_HOURS - 1)) * 100
  }));

  // Color based on theme
  const primaryColor = isDarkMode ? '#f9f6ef' : '#751d0c'; // Snowbird White in dark mode, Moab Mahogany in light mode

  return (
    <div className={`backdrop-blur-md rounded-xl border ${isDarkMode ? 'border-white' : 'border-mahogany'} shadow-lg px-6 py-4 ${
      isDarkMode 
        ? 'bg-gray-900/95' 
        : 'bg-white/95'
    }`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${
              isDarkMode
                ? 'border-white bg-forest/20 text-white hover:bg-forest/30'
                : 'border-mahogany bg-sage-light text-mahogany hover:bg-sage'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSpeedOptions(!showSpeedOptions)}
            className={`h-10 px-4 rounded-lg text-sm font-medium transition-all border ${
              isDarkMode
                ? 'border-white bg-gray-800 hover:bg-gray-700 text-white'
                : 'border-mahogany bg-gray-100 hover:bg-gray-200 text-mahogany'
            }`}
          >
            {playbackSpeed}x
          </button>

          {showSpeedOptions && (
            <div className={`absolute bottom-full mb-2 rounded-lg shadow-lg border ${
              isDarkMode ? 'border-white bg-gray-800' : 'border-mahogany bg-white'
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
                        ? 'bg-forest/20 text-white'
                        : 'bg-sage-light text-mahogany'
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
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${
              isDarkMode
                ? 'border-white hover:bg-gray-800 text-white'
                : 'border-mahogany hover:bg-gray-100 text-mahogany'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-1 pb-8">
            <div 
              className={`absolute -top-8 py-1 px-2 rounded-lg text-sm font-medium transform -translate-x-1/2 border ${isDarkMode ? 'border-white' : 'border-mahogany'} ${isDarkMode ? 'text-black' : 'text-white'}`}
              style={{ 
                left: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`,
                backgroundColor: primaryColor,
                zIndex: 10
              }}
            >
              {String(currentHour % 24).padStart(2, '0')}:00 UTC
            </div>

            <div 
              className="absolute h-8 w-0.5 -translate-x-1/2"
              style={{ 
                left: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`,
                top: '-8px',
                backgroundColor: primaryColor
              }}
            />

            {/* Day markers at the start of each day with vertical lines */}
            <div className="absolute inset-x-0 bottom-0 h-8 pointer-events-none">
              {dayMarkerPositions.map((marker, index) => (
                <div key={index} className="absolute" style={{ left: `${marker.position}%` }}>
                  {/* Small vertical line */}
                  <div
                    className="w-0.5 -translate-x-1/2 absolute"
                    style={{ 
                      backgroundColor: primaryColor,
                      height: '12px',
                      top: '-12px'
                    }}
                  />
                  {/* Marker line */}
                  <div
                    className="w-0.5 h-6 -translate-x-1/2"
                    style={{ backgroundColor: primaryColor }}
                  />
                  {/* Date label */}
                  <div 
                    className="text-xs font-medium mt-1 -translate-x-1/2" 
                    style={{ 
                      position: 'absolute',
                      whiteSpace: 'nowrap',
                      color: primaryColor
                    }}
                  >
                    {marker.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline track */}
            <div 
              className={`absolute h-0.5 w-full top-1/2 -translate-y-1/2 border-t border-b ${isDarkMode ? 'border-white' : 'border-mahogany'}`}
              style={{ 
                backgroundColor: isDarkMode ? '#4B5563' : '#D1D5DB',
              }}
            />

            {/* Timeline progress */}
            <div 
              className="absolute h-0.5 left-0 top-1/2 -translate-y-1/2 transition-all"
              style={{ 
                width: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`,
                backgroundColor: primaryColor
              }}
            />

            <input
              type="range"
              min="0"
              max={TOTAL_HOURS - 1}
              value={currentHour}
              onChange={handleSliderChange}
              className={`absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full ${isDarkMode ? '[&::-webkit-slider-thumb]:bg-white' : '[&::-webkit-slider-thumb]:bg-mahogany'} [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-[2px] ${isDarkMode ? '[&::-webkit-slider-thumb]:border-white' : '[&::-webkit-slider-thumb]:border-mahogany'}`}
            />
          </div>

          <button
            onClick={handleNextHour}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${
              isDarkMode
                ? 'border-white hover:bg-gray-800 text-white'
                : 'border-mahogany hover:bg-gray-100 text-mahogany'
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