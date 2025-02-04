import React, { useState, useEffect } from 'react';

const PM25_LEVELS = [
  { value: 0, label: 'Good', color: 'bg-green-500', text: 'text-green-700', maxValue: 12.0 },
  { value: 12.1, label: 'Moderate', color: 'bg-yellow-500', text: 'text-yellow-700', maxValue: 35.4 },
  { value: 35.5, label: 'Unhealthy for Sensitive Groups', color: 'bg-orange-500', text: 'text-orange-700', maxValue: 55.4 },
  { value: 55.5, label: 'Unhealthy', color: 'bg-red-500', text: 'text-red-700', maxValue: 150.4 },
  { value: 150.5, label: 'Very Unhealthy', color: 'bg-purple-500', text: 'text-purple-700', maxValue: 250.4 },
  { value: 250.5, label: 'Hazardous', color: 'bg-rose-500', text: 'text-rose-700', maxValue: 500.4 }
];

export const PM25Controls = ({
  pm25Threshold,
  setPM25Threshold,
  isDarkMode
}) => {
  const [showPanel, setShowPanel] = useState(false);

  const getPM25Color = (value) => {
    if (value <= 12.0) return 'bg-green-500';
    if (value <= 35.4) return 'bg-yellow-500';
    if (value <= 55.4) return 'bg-orange-500';
    if (value <= 150.4) return 'bg-red-500';
    if (value <= 250.4) return 'bg-purple-500';
    return 'bg-rose-500';
  };

  const getPM25Label = (value) => {
    return PM25_LEVELS.find(level => 
      value >= level.value && value <= level.maxValue
    )?.label || 'Extreme';
  };

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
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
          isDarkMode ? 'bg-gray-800/95 text-gray-200' : 'bg-white/95 text-gray-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getPM25Color(pm25Threshold)}`} />
          <span className="font-medium">{pm25Threshold.toFixed(1)}+ μg/m³</span>
        </div>
      </button>

      {showPanel && (
        <div 
          className={`absolute top-full left-0 mt-2 w-72 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'
          } backdrop-blur-sm p-4`}
        >
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="500"
              step="0.1"
              value={pm25Threshold}
              onChange={(e) => setPM25Threshold(parseFloat(e.target.value))}
              className="w-full h-2 appearance-none rounded cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #00e400, #ffff00, #ff7e00, #ff0000, #8f3f97, #7e0023)',
              }}
            />

            <div className="grid grid-cols-3 gap-1">
              {PM25_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => setPM25Threshold(level.value)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-colors
                    ${level.color} bg-opacity-15 hover:bg-opacity-25 ${level.text}
                    ${Math.abs(pm25Threshold - level.value) < 0.1 ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                  `}
                  title={`${level.label} (${level.value} - ${level.maxValue} μg/m³)`}
                >
                  {level.value}
                </button>
              ))}
            </div>

            <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {getPM25Label(pm25Threshold)} ({pm25Threshold.toFixed(1)} μg/m³)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};