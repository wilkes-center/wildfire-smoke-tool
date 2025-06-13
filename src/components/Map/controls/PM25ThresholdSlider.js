import { Check, Edit2 } from 'lucide-react';
import React, { useState } from 'react';

import { PM25_LEVELS } from '../../../constants/pm25Levels';

const PM25ThresholdSlider = ({ pm25Threshold = 5, setPM25Threshold, isDarkMode }) => {
  const [inputValue, setInputValue] = useState(pm25Threshold.toString());
  const [isEditing, setIsEditing] = useState(false);

  const getCurrentLevel = value => {
    return PM25_LEVELS.find((level, index) => {
      const nextLevel = PM25_LEVELS[index + 1];
      return value >= level.value && (!nextLevel || value < nextLevel.value);
    });
  };

  const handleInputChange = e => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    let newValue = parseFloat(inputValue);

    if (isNaN(newValue)) {
      newValue = pm25Threshold;
    } else {
      newValue = Math.max(5, Math.min(500, newValue));
    }

    setPM25Threshold(newValue);
    setInputValue(newValue.toFixed(1));
  };

  const handleInputKeyDown = e => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const handleCheckClick = () => {
    handleInputBlur();
  };

  const currentLevel = getCurrentLevel(pm25Threshold);

  return (
    <div
      className={`backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 flex items-center transition-all duration-300 border-2 ${
        isDarkMode
          ? 'bg-gray-800/95 text-gray-200 border-white'
          : 'bg-white/95 text-gray-800 border-mahogany'
      }`}
    >
      <div className="text-xl font-medium">PM2.5</div>
      <div className={`w-px h-6 mx-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div
        className="flex items-center gap-2"
        title={isEditing ? "Click check to save" : "Click to edit threshold"}
      >
        {isEditing ? (
          <>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className={`w-16 px-1 py-0 rounded text-center text-xl font-medium ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-200 focus:bg-gray-600'
                    : 'bg-gray-100 text-gray-800 focus:bg-white'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                style={{ fontSize: '1.25rem', lineHeight: '1.75rem' }}
                autoFocus
                min="5"
                max="500"
                step="0.1"
              />
              <span className="text-xl font-medium" style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>
                + μg/m³
              </span>
            </div>
            <Check
              className={`w-4 h-4 cursor-pointer hover:opacity-80 transition-opacity ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}
              onClick={handleCheckClick}
            />
          </>
        ) : (
          <>
            <span
              className="text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: currentLevel?.color }}
              onClick={() => setIsEditing(true)}
            >
              {pm25Threshold.toFixed(1)}+ μg/m³
            </span>
            <Edit2
              className={`w-4 h-4 cursor-pointer hover:opacity-80 transition-opacity ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
              onClick={() => setIsEditing(true)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PM25ThresholdSlider;
