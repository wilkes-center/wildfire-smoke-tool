import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatDateTime } from '../../../utils/map/timeUtils';

export const DateTime = ({ timestamp, currentDateTime, isDarkMode }) => {
  // Support both prop naming conventions for backward compatibility
  const dateTimeObj = timestamp || currentDateTime;
  if (!dateTimeObj || !dateTimeObj.date) return null;
  
  const formattedDateTime = formatDateTime(dateTimeObj);

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
            {formattedDateTime}
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
            {String(dateTimeObj.hour).padStart(2, '0')}:00
            <span className={`ml-2 text-sm ${
              isDarkMode ? 'text-white/80' : 'text-forest-light'
            }`}>
              UTC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTime;