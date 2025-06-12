import React from 'react';

import { PM25_LEVELS } from '../../../constants/pm25Levels';

/**
 * Vertical PM2.5 Legend with stacked color bars
 */
const PM25LegendVertical = ({ isDarkMode }) => {
  const displayLevels = PM25_LEVELS.slice(0, -1); // Remove duplicate hazardous level

  return (
    <div
      className={`backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 transition-all duration-300 border-2 ${
        isDarkMode
          ? 'bg-gray-800/95 text-gray-200 border-white'
          : 'bg-white/95 text-gray-800 border-mahogany'
      }`}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="text-sm font-medium text-center">
          PM2.5 Levels
          <div className={`text-xs font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            (μg/m³)
          </div>
        </div>

        {/* Vertical color bars */}
        <div className="space-y-1">
          {displayLevels.map((level, index) => (
            <div key={level.value} className="flex items-center gap-2">
              <div
                className="w-4 h-3 rounded-sm shadow-sm"
                style={{
                  backgroundColor: isDarkMode ? level.darkColor : level.color
                }}
              />
              <div className="flex-1 text-xs">
                <span className="font-medium">{level.shortLabel || level.label}</span>
                <span className={`ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({level.value === 250.5 ? '250+' : `${level.value}-${level.maxValue}`})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PM25LegendVertical;
