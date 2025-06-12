import { ChevronLeft, ChevronRight, Clock, Pause, Play } from 'lucide-react';
import React, { useState } from 'react';

import { START_DATE, TILESET_INFO, TOTAL_HOURS } from '../../../utils/map/constants.js';
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
    const dayOffset = Math.floor(currentHour / 24);
    const hourOfDay = currentHour % 24;

    // Use the same logic as generateDateLabel to get the actual tileset date
    const tilesetIndex = dayOffset * 2; // First chunk of the day (0-11 hours)

    let dateStr;
    if (tilesetIndex < TILESET_INFO.length) {
      // Get the date directly from TILESET_INFO to ensure alignment
      dateStr = TILESET_INFO[tilesetIndex].date;
    } else {
      // Fallback calculation if tileset not found
      const date = new Date(START_DATE);
      date.setUTCDate(date.getUTCDate() + dayOffset);
      dateStr = date.toISOString().split('T')[0];
    }

    const localTime = formatLocalDateTime({ date: dateStr, hour: hourOfDay });
    return localTime;
  };

  const generateDateLabel = dayOffset => {
    // Important: tilesets are ordered by date, with 2 per day (0-11 hours and 12-23 hours)
    const tilesetIndex = dayOffset * 2; // First chunk of the day (0-11 hours)

    console.log(
      `TimeControls generateDateLabel: dayOffset=${dayOffset}, tilesetIndex=${tilesetIndex}`
    );
    console.log('TILESET_INFO:', TILESET_INFO);

    if (tilesetIndex < TILESET_INFO.length) {
      // Get the date directly from TILESET_INFO to ensure alignment
      const tilesetDate = TILESET_INFO[tilesetIndex].date;
      console.log(`Day ${dayOffset} date from tileset: ${tilesetDate}`);

      // Parse the date string and convert to local date for display
      const dateStr = tilesetDate;
      const [year, month, day] = dateStr.split('-').map(Number);

      // Create UTC date first
      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

      // Format in user's local timezone to match the time display
      const localDateStr = utcDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      console.log(
        `TimeControls: Day ${dayOffset} -> ${localDateStr} (from tileset ${tilesetDate})`
      );
      return `${localDateStr} (UTC)`;
    }

    // Fallback calculation if tileset not found
    console.warn(`No tileset found for day offset ${dayOffset} (index ${tilesetIndex})`);
    const date = new Date(START_DATE);
    date.setUTCDate(date.getUTCDate() + dayOffset);

    // Apply local formatting with UTC indicator
    const localDateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    console.log(`TimeControls fallback: Day ${dayOffset} -> ${localDateStr} (from START_DATE)`);
    return `${localDateStr} (UTC)`;
  };

  // Position day markers at the start of each day (0, 24 hours)
  const dayMarkerPositions = [
    { label: generateDateLabel(0), hour: 0 },
    { label: generateDateLabel(1), hour: 24 }
  ].map(marker => ({
    ...marker,
    position: (marker.hour / (TOTAL_HOURS - 1)) * 100
  }));

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
                ? 'bg-white/90 text-gray-800 hover:bg-white/80'
                : 'bg-white/90 text-mahogany hover:bg-white/80'
            }`}
          >
            {playbackSpeed}x
          </button>

          {/* Go to Current Time Button - Always visible */}
          <button
            onClick={handleGoToCurrentTime}
            className={`h-10 px-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors backdrop-blur-sm shadow-lg border ${
              isDarkMode
                ? 'bg-blue-900/20 text-blue-300 border-blue-700/30 hover:bg-blue-900/30'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
            title="Jump to current time"
          >
            <Clock className="w-4 h-4" />
            <span>Now</span>
          </button>

          {showSpeedOptions && (
            <div
              className={`absolute bottom-full mb-2 rounded-lg shadow-lg backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-white/90 border border-gray-200'
                  : 'bg-white/90 border border-mahogany/20'
              }`}
            >
              {[1, 2, 3].map(speed => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackSpeed(speed);
                    setShowSpeedOptions(false);
                  }}
                  className={`w-full px-4 py-2 text-sm transition-all ${
                    playbackSpeed === speed
                      ? isDarkMode
                        ? 'bg-forest/20 text-gray-800'
                        : 'bg-sage-light text-mahogany'
                      : isDarkMode
                        ? 'hover:bg-gray-100 text-gray-600'
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
              {currentLocalTime.time} {currentLocalTime.timezone}
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
                    className="text-xs font-medium mt-1"
                    style={{
                      position: 'absolute',
                      whiteSpace: 'nowrap',
                      color: primaryColor,
                      transform:
                        index === 0
                          ? 'translateX(0)'
                          : index === 1
                            ? 'translateX(-100%)'
                            : 'translateX(-50%)',
                      left: index === 0 ? 0 : index === 1 ? '100%' : '50%'
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
