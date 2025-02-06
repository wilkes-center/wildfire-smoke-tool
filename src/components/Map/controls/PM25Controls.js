import React, { useState, useEffect } from 'react';
import { Wind } from 'lucide-react';

const DEFAULT_THRESHOLD = 1;

const PM25_LEVELS = [
  { value: 0, label: 'Good', maxValue: 12.0 },
  { value: 12.1, label: 'Moderate', maxValue: 35.4 },
  { value: 35.5, label: 'Unhealthy for Sensitive Groups', maxValue: 55.4 },
  { value: 55.5, label: 'Unhealthy', maxValue: 150.4 },
  { value: 150.5, label: 'Very Unhealthy', maxValue: 250.4 },
  { value: 250.5, label: 'Hazardous', maxValue: 500.4 }
];

const getPM25Label = (value) => {
  return PM25_LEVELS.find(level => 
    value >= level.value && value <= level.maxValue
  )?.label || 'Extreme';
};

export const PM25Controls = ({
  pm25Threshold = DEFAULT_THRESHOLD,
  setPM25Threshold,
  isDarkMode
}) => {
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!showPanel) return;

    const handleClickOutside = (event) => {
      if (!event.target.closest('.pm25-panel-container')) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel]);

  return (
    <div className="relative pm25-panel-container">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isDarkMode 
            ? 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-200' 
            : 'bg-white/90 hover:bg-gray-50/90 text-gray-800'
        }`}
      >
        <Wind className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">{pm25Threshold.toFixed(1)} μg/m³</span>
      </button>

      {showPanel && (
        <div 
          className={`absolute top-full right-0 mt-2 w-64 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'
          } backdrop-blur-sm p-4`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                PM2.5 Threshold
              </span>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {pm25Threshold.toFixed(1)} μg/m³
              </span>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="500"
                step="0.1"
                value={pm25Threshold}
                onChange={(e) => setPM25Threshold(parseFloat(e.target.value))}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer 
                  ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                style={{
                  backgroundImage: `linear-gradient(to right, 
                    ${isDarkMode ? '#3B82F6' : '#2563EB'} 0%, 
                    ${isDarkMode ? '#3B82F6' : '#2563EB'} ${(pm25Threshold / 500) * 100}%, 
                    ${isDarkMode ? '#374151' : '#E5E7EB'} ${(pm25Threshold / 500) * 100}%, 
                    ${isDarkMode ? '#374151' : '#E5E7EB'} 100%)`
                }}
              />
              
              <div className="flex justify-between mt-2">
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>0</span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>500</span>
              </div>
            </div>

            <div className="px-1">
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Current Level: <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>
                  {getPM25Label(pm25Threshold)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {[1, 12, 35.5, 55.5, 150.5, 250.5].map(value => (
                <button
                  key={value}
                  onClick={() => setPM25Threshold(value)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors
                    ${pm25Threshold === value 
                      ? isDarkMode 
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PM25Controls;