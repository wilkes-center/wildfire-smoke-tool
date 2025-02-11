import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export const DateTime = ({ currentDateTime, isDarkMode }) => {
  if (!currentDateTime || !currentDateTime.date) {
    return null;
  }

  return (
    <div className={`backdrop-blur-md rounded-lg border-2 shadow-lg px-6 py-3 ${
      isDarkMode 
        ? 'bg-gray-900/95 border-purple-500' 
        : 'bg-white/95 border-purple-500'
    }`}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${
            isDarkMode 
              ? 'bg-purple-500/10 text-purple-400' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className={`text-lg font-medium ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {currentDateTime.date}
          </span>
        </div>

        <div className={`h-6 w-px ${
          isDarkMode ? 'bg-purple-500/30' : 'bg-purple-300'
        }`} />

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${
            isDarkMode 
              ? 'bg-purple-500/10 text-purple-400' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className={`text-lg font-medium ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {String(currentDateTime.hour).padStart(2, '0')}:00
            <span className={`ml-2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
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