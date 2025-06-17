import React, { useState } from 'react';

import { Check, Edit2 } from 'lucide-react';

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
    <div className="space-y-3">
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
          title={isEditing ? 'Click check to save' : 'Click to edit threshold'}
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
                  step="1"
                />
                <span
                  className="text-xl font-medium"
                  style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}
                >
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

      {/* Slider always visible below the main control */}
      <div
        className={`backdrop-blur-sm rounded-xl shadow-lg px-6 py-4 transition-all duration-300 border-2 ${
          isDarkMode
            ? 'bg-gray-800/95 text-gray-200 border-white'
            : 'bg-white/95 text-gray-800 border-mahogany'
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Adjust Threshold
            </span>
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {pm25Threshold.toFixed(1)} μg/m³
            </span>
          </div>

          <div className="relative">
            {/* Background slider with PM2.5 zone markers */}
            <div
              className="relative w-full h-2 rounded-lg overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${PM25_LEVELS.slice(0, -1).map((level, index) => {
                  const color = isDarkMode ? level.darkColor : level.color;
                  const position = ((level.value - 5) / (500 - 5)) * 100;
                  return `${color} ${position}%`;
                }).join(', ')})`
              }}
            >
              {/* Zone markers on the track */}
              {PM25_LEVELS.slice(0, -1).map((level, index) => {
                const position = ((level.value - 5) / (500 - 5)) * 100;
                if (position < 0 || position > 100) return null;

                return (
                  <div
                    key={`track-marker-${level.value}`}
                    className="absolute top-0 w-0.5 h-full bg-white/80 shadow-sm"
                    style={{ left: `${position}%` }}
                  />
                );
              })}

              {/* Current threshold indicator overlay */}
              <div
                className="absolute top-0 left-0 h-full bg-black/20 transition-all duration-200"
                style={{ width: `${(pm25Threshold / 500) * 100}%` }}
              />
            </div>

            {/* Invisible range input overlay for interaction */}
            <input
              type="range"
              min="5"
              max="500"
              step="1"
              value={pm25Threshold}
              onChange={e => {
                const newValue = parseFloat(e.target.value);
                setPM25Threshold(newValue);
                setInputValue(newValue.toString());
              }}
              className="absolute inset-0 w-full h-2 rounded-lg appearance-none cursor-pointer bg-transparent"
              style={{
                background: 'transparent',
              }}
            />

            <div className="flex justify-between mt-2">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                5
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                500
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PM25ThresholdSlider;
