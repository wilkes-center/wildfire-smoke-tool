import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatDateTime, formatLocalDateTime, isLocalTimeDifferentFromUTC } from '../../../utils/map/timeUtils';

export const DateTime = ({ timestamp, currentDateTime, isDarkMode, showUTC = false }) => {
  // Support both prop naming conventions for backward compatibility
  const dateTimeObj = timestamp || currentDateTime;
  if (!dateTimeObj || !dateTimeObj.date) return null;
  
  // Enhanced debugging to see what's being passed in
  console.log('DateTime component received:', dateTimeObj);
  
  const formattedDateTime = formatDateTime(dateTimeObj);
  const localDateTime = formatLocalDateTime(dateTimeObj);
  const shouldShowUTC = showUTC || isLocalTimeDifferentFromUTC(dateTimeObj);

  return (
    <div className={`backdrop-blur-md rounded-lg border-2 shadow-lg px-6 py-3 ${
      isDarkMode 
        ? 'bg-gray-900/95 border-white' 
        : 'bg-white/95 border-mahogany'
    }`}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${
            isDarkMode 
              ? 'bg-forest/10 text-white' 
              : 'bg-sage-light text-forest'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className={`text-lg font-medium ${
            isDarkMode ? 'text-white' : 'text-forest'
          }`}>
            {localDateTime.date}
          </span>
        </div>

        <div className={`h-6 w-px ${
          isDarkMode ? 'bg-white/30' : 'bg-sage'
        }`} />

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${
            isDarkMode 
              ? 'bg-forest/10 text-white' 
              : 'bg-sage-light text-forest'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className={`text-lg font-medium ${
            isDarkMode ? 'text-white' : 'text-forest'
          }`}>
            {localDateTime.time}
            <span className={`ml-2 text-sm ${
              isDarkMode ? 'text-white/80' : 'text-forest-light'
            }`}>
              {localDateTime.timezone}
            </span>
            {shouldShowUTC && (
              <div className={`text-sm mt-1 ${
                isDarkMode ? 'text-white/60' : 'text-forest/60'
              }`}>
                UTC: {String(dateTimeObj.hour).padStart(2, '0')}:00
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTime;