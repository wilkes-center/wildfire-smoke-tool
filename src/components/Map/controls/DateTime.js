import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export const DateTime = ({ currentDateTime, isDarkMode }) => {
  if (!currentDateTime || !currentDateTime.date) {
    return null;
  }

  return (
    <div className="p-0.5 rounded-xl" style={{ backgroundColor: '#DC4A23' }}>
      <div className={`backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 flex items-center gap-4 ${
        isDarkMode 
          ? 'bg-gray-900/95 text-gray-100' 
          : 'bg-white text-gray-800'
      }`}>
        <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <div className="text-xl font-medium">
          {currentDateTime.date}
        </div>
        <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <Clock className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <div className="text-xl font-medium flex items-center gap-2">
          {String(currentDateTime.hour).padStart(2, '0')}:00
          <span className={`text-sm font-normal ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>UTC</span>
        </div>
      </div>
    </div>
  );
};