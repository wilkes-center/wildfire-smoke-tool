import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export const DateTime = ({ currentDateTime, isDarkMode }) => {
  if (!currentDateTime || !currentDateTime.date) return null;

  return (
    <div className={`backdrop-blur-md rounded-lg border-2 shadow-lg px-6 py-3 ${
      isDarkMode 
        ? 'bg-gray-900/95 border-forest' 
        : 'bg-white/95 border-forest'
    }`}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${
            isDarkMode 
              ? 'bg-forest/10 text-gold' 
              : 'bg-sage-light text-forest'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className={`text-lg font-medium ${
            isDarkMode ? 'text-gold-light' : 'text-forest'
          }`}>
            {currentDateTime.date}
          </span>
        </div>

        <div className={`h-6 w-px ${
          isDarkMode ? 'bg-forest/30' : 'bg-sage'
        }`} />

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${
            isDarkMode 
              ? 'bg-forest/10 text-gold' 
              : 'bg-sage-light text-forest'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className={`text-lg font-medium ${
            isDarkMode ? 'text-gold-light' : 'text-forest'
          }`}>
            {String(currentDateTime.hour).padStart(2, '0')}:00
            <span className={`ml-2 text-sm ${
              isDarkMode ? 'text-sage' : 'text-forest-light'
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