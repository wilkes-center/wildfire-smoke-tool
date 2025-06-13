import React, { useState } from 'react';

import { ChevronLeft, ChevronRight, Clock, Pause, Play } from 'lucide-react';

import { START_DATE, TOTAL_HOURS } from '../../../utils/map/constants.js';
import { formatLocalDateTime, getCurrentTimelineHour } from '../../../utils/map/timeUtils.js';

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

  const handleSliderChange = e => {
    const newHour = parseInt(e.target.value);
    setCurrentHour(newHour);
    if (onTimeChange) onTimeChange(newHour);
  };

  // Jump to current time
  const handleGoToCurrentTime = () => {
    const currentTimelineHour = getCurrentTimelineHour(START_DATE, TOTAL_HOURS);
    setCurrentHour(currentTimelineHour);
    if (onTimeChange) onTimeChange(currentTimelineHour);
  };

  // Check if we're at current time (within 1 hour tolerance)
  const isAtCurrentTime = () => {
    const currentTimelineHour = getCurrentTimelineHour(START_DATE, TOTAL_HOURS);
    return Math.abs(currentHour - currentTimelineHour) <= 1;
  };

  // Get local time for current hour tooltip
  const getCurrentLocalTime = () => {
    const startDate = new Date(START_DATE);
    const currentDate = new Date(startDate.getTime() + currentHour * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];
    const hour = currentDate.getUTCHours();
    return formatLocalDateTime({ date: dateStr, hour: hour });
  };

  // Generate date labels dynamically
  const generateDateLabel = dayOffset => {
    const date = new Date(START_DATE);
    date.setUTCDate(date.getUTCDate() + dayOffset);

    // Format in UTC timezone to ensure consistent display
    const localDateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });

    return `${localDateStr} (UTC)`;
  };

  // Dynamically position day markers based on the total timeline hours
  // This ensures we only render markers that fall within the timeline range
  const dayMarkerPositions = Array.from({ length: Math.ceil(TOTAL_HOURS / 24) }, (_, dayIndex) => {
    const hour = dayIndex * 24;
    return {
      label: generateDateLabel(dayIndex),
      hour,
      position: (hour / (TOTAL_HOURS - 1)) * 100
    };
  });

  // Color based on theme
  const primaryColor = isDarkMode ? '#f9f6ef' : '#751d0c';
  const currentLocalTime = getCurrentLocalTime();

  return (
    <div
      className={`backdrop-blur-md rounded-xl border ${isDarkMode ? 'border-white' : 'border-mahogany'} shadow-lg px-6 py-4 ${
        isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
      }`}
    >
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
            className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm shadow-lg ${
              isDarkMode
                ? 'bg-gray-800/90 hover:bg-gray-700/90 text-white border border-white'
                : 'bg-gray-100/90 hover:bg-gray-200/90 text-gray-700 border border-mahogany'
            }`}
          >
            {playbackSpeed}x Speed
          </button>

          {showSpeedOptions && (
            <div
              className={`absolute bottom-full mb-2 flex gap-1 p-2 rounded-lg shadow-lg backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-gray-800/90 border border-white'
                  : 'bg-white/90 border border-mahogany'
              }`}
            >
              {[1, 2, 3, 8].map(speed => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackSpeed(speed);
                    setShowSpeedOptions(false);
                  }}
                  className={`px-3 py-1 rounded-md transition-colors text-sm ${
                    playbackSpeed === speed
                      ? isDarkMode
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-600'
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
            {/* Custom time marker that shows the current time */}
            <div
              className={`absolute -top-8 py-1 px-2 rounded-lg text-sm font-medium transform -translate-x-1/2 border transition-all duration-200 ease-out z-20 shadow-md ${isDarkMode ? 'border-white bg-gray-800/95 text-white' : 'border-mahogany bg-white/95 text-mahogany'}`}
              style={{
                left: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`
              }}
              title={`Local time: ${currentLocalTime.time} ${currentLocalTime.timezone} | Date: ${currentLocalTime.date}`}
            >
              {currentLocalTime.time} {currentLocalTime.timezone}
            </div>

            {/* Custom slider marker */}
            <div
              className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 transition-all duration-200 ease-out z-20 shadow-lg ${isDarkMode ? 'bg-white border-gray-800' : 'bg-mahogany border-white'}`}
              style={{
                left: `${(currentHour / (TOTAL_HOURS - 1)) * 100}%`,
                top: '50%'
              }}
            />

            {/* Day markers with dates - only 2 days */}
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
                    className="text-xs font-medium mt-1 absolute"
                    style={{
                      whiteSpace: 'nowrap',
                      color: primaryColor,
                      transform: index === 0 ? 'translateX(0)' : 'translateX(-50%)',
                      left: index === 0 ? '0' : '50%'
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
                backgroundColor: isDarkMode ? '#4B5563' : '#D1D5DB'
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
              className={`absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:cursor-pointer`}
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

        {/* Show Current Time button */}
        <button
          onClick={handleGoToCurrentTime}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
            isDarkMode
              ? 'border-white bg-gray-800/90 hover:bg-gray-700/90 text-white'
              : 'border-mahogany bg-gray-100/90 hover:bg-gray-200/90 text-mahogany'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Now</span>
        </button>
      </div>
    </div>
  );
};

export default TimeControls;
