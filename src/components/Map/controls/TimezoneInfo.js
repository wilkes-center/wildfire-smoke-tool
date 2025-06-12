import { Globe } from 'lucide-react';
import React from 'react';

import { getUserTimezone } from '../../../utils/map/timeUtils';

/**
 * Component that displays user's timezone information
 */
export const TimezoneInfo = ({ isDarkMode, className = '' }) => {
  const timezoneInfo = getUserTimezone();

  if (timezoneInfo.isUTC) {
    return null; // Don't show if user is already in UTC
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm ${className} ${
        isDarkMode ? 'text-white/80' : 'text-forest/80'
      }`}
    >
      <Globe className="w-4 h-4" />
      <span>
        Your timezone: {timezoneInfo.timezone} (UTC{timezoneInfo.offsetString})
      </span>
    </div>
  );
};

export default TimezoneInfo;
