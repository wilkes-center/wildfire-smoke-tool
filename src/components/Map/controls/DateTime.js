import React from 'react';
import { Calendar, Clock } from 'lucide-react';


export const DateTime = ({ currentDateTime, isDarkMode }) => {
  if (!currentDateTime || !currentDateTime.date) {
    return null;
  }

  return (
    <div className={`backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 flex items-center gap-4 ${
      isDarkMode ? 'bg-gray-800/95 text-gray-200' : 'bg-white/95 text-gray-800'
    }`}>
      <Calendar className="w-5 h-5 text-gray-400" />
      <div className="text-xl font-medium">
        {currentDateTime.date}
      </div>
      <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <Clock className="w-5 h-5 text-gray-400" />
      <div className="text-xl font-medium">
        {String(currentDateTime.hour).padStart(2, '0')}:00
      </div>
    </div>
  );
};