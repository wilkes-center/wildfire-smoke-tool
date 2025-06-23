import React from 'react';

import { Calendar, Clock, Info } from 'lucide-react';

import { formatLocalDateTime, isLocalTimeDifferentFromUTC } from '../../../utils/map/timeUtils';

export const DateTime = ({
  timestamp,
  currentDateTime,
  isDarkMode,
  showUTC = false,
  currentHour,
  totalHours,
  isShowingPreviousDays
}) => {
  // Support both prop naming conventions for backward compatibility
  const dateTimeObj = timestamp || currentDateTime;
  if (!dateTimeObj || !dateTimeObj.date) return null;

  // Enhanced debugging to see what's being passed in
  console.log('DateTime component received:', dateTimeObj);

  const localDateTime = formatLocalDateTime(dateTimeObj);
  const showLocalTime = isLocalTimeDifferentFromUTC(dateTimeObj);

  // Check if we're at the end of the timeline and showing previous days
  const isAtEndOfTimeline = currentHour === totalHours - 1;
  const shouldShowNextDataMessage = isAtEndOfTimeline && isShowingPreviousDays;

  // Get the next data availability time (19:30 UTC = 1:30 PM MDT)
  const getNextDataAvailableTime = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextUpdateTime = new Date(today.getTime());
    nextUpdateTime.setUTCHours(19, 30, 0, 0); // 19:30 UTC = 1:30 PM MDT

    // If it's already past today's update time, show tomorrow's update time
    if (now >= nextUpdateTime) {
      nextUpdateTime.setUTCDate(nextUpdateTime.getUTCDate() + 1);
    }

    const dateStr = nextUpdateTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });

    return `${dateStr} at 19:30 UTC`;
  };

  // Format UTC date
  const [year, month, day] = dateTimeObj.date.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const utcDateStr = utcDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

  return (
    <div
      className={`backdrop-blur-md rounded-xl border-2 shadow-lg px-8 py-4 ${
        isDarkMode ? 'bg-gray-900/95 border-white' : 'bg-white/95 border-mahogany'
      }`}
    >
      <div className="flex items-center gap-8">
        {/* Date Section */}
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-forest/10 text-white' : 'bg-sage-light text-forest'
            }`}
          >
            <Calendar className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span
                className={`font-semibold ${isDarkMode ? 'text-white' : 'text-forest'}`}
                style={{ fontSize: 'clamp(1rem, 2.2vw, 1.25rem)' }}
              >
                {utcDateStr}
              </span>
              <span
                className={`${isDarkMode ? 'text-white/60' : 'text-forest/60'}`}
                style={{ fontSize: 'clamp(0.875rem, 1.8vw, 1rem)' }}
              >
                UTC
              </span>
            </div>
            {showLocalTime && (
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span
                  className={`${isDarkMode ? 'text-white/70' : 'text-forest/70'}`}
                  style={{ fontSize: 'clamp(0.875rem, 1.8vw, 1rem)' }}
                >
                  {localDateTime.date}
                </span>
                <span
                  className={`${isDarkMode ? 'text-white/50' : 'text-forest/50'}`}
                  style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}
                >
                  {localDateTime.timezone}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={`h-12 w-px ${isDarkMode ? 'bg-white/30' : 'bg-sage'}`} />

        {/* Time Section */}
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-forest/10 text-white' : 'bg-sage-light text-forest'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span
                className={`font-semibold ${isDarkMode ? 'text-white' : 'text-forest'}`}
                style={{ fontSize: 'clamp(1rem, 2.2vw, 1.25rem)' }}
              >
                {String(dateTimeObj.hour).padStart(2, '0')}:00
              </span>
              <span
                className={`${isDarkMode ? 'text-white/60' : 'text-forest/60'}`}
                style={{ fontSize: 'clamp(0.875rem, 1.8vw, 1rem)' }}
              >
                UTC
              </span>
            </div>
            {showLocalTime && (
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span
                  className={`${isDarkMode ? 'text-white/70' : 'text-forest/70'}`}
                  style={{ fontSize: 'clamp(0.875rem, 1.8vw, 1rem)' }}
                >
                  {localDateTime.time}
                </span>
                <span
                  className={`${isDarkMode ? 'text-white/50' : 'text-forest/50'}`}
                  style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}
                >
                  {localDateTime.timezone}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next day data availability message */}
      {shouldShowNextDataMessage && (
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/20' : 'border-mahogany/20'}`}>
          <div className={`flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-blue-300' : 'text-blue-600'
          }`}>
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Next day's data will be available on {getNextDataAvailableTime()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTime;
