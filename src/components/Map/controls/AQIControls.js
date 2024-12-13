import React, { useState, useEffect } from 'react';
import { Gauge } from 'lucide-react';

const AQI_LEVELS = [
  { value: 0, label: 'Good', color: 'bg-green-500', text: 'text-green-700' },
  { value: 51, label: 'Moderate', color: 'bg-yellow-500', text: 'text-yellow-700' },
  { value: 101, label: 'Unhealthy for Sensitive Groups', color: 'bg-orange-500', text: 'text-orange-700' },
  { value: 151, label: 'Unhealthy', color: 'bg-red-500', text: 'text-red-700' },
  { value: 201, label: 'Very Unhealthy', color: 'bg-purple-500', text: 'text-purple-700' },
  { value: 301, label: 'Hazardous', color: 'bg-rose-500', text: 'text-rose-700' }
];

export const AQIControls = ({
  aqiThreshold,
  setAqiThreshold,
  isDarkMode
}) => {
  const [showAQIPanel, setShowAQIPanel] = useState(false);

  const getAQIColor = (value) => {
    if (value <= 50) return 'bg-green-500';
    if (value <= 100) return 'bg-yellow-500';
    if (value <= 150) return 'bg-orange-500';
    if (value <= 200) return 'bg-red-500';
    if (value <= 300) return 'bg-purple-500';
    return 'bg-rose-500';
  };

  const getAQILabel = (value) => {
    return AQI_LEVELS.find(level => 
      value >= level.value && 
      (value < AQI_LEVELS[AQI_LEVELS.indexOf(level) + 1]?.value || !AQI_LEVELS[AQI_LEVELS.indexOf(level) + 1])
    )?.label || 'Custom';
  };

  useEffect(() => {
    if (!showAQIPanel) return;

    const handleClickOutside = (event) => {
      if (!event.target.closest('.aqi-panel-container')) {
        setShowAQIPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAQIPanel]);

  return (
    <div className="relative aqi-panel-container">
      <button
        onClick={() => setShowAQIPanel(!showAQIPanel)}
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
          isDarkMode ? 'bg-gray-800/95 text-gray-200' : 'bg-white/95 text-gray-800'
        }`}
      >
        <Gauge className="w-5 h-5" />
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getAQIColor(aqiThreshold)}`} />
          <span className="font-medium">{aqiThreshold}+ AQI</span>
        </div>
      </button>

      {showAQIPanel && (
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
              value={aqiThreshold}
              onChange={(e) => setAqiThreshold(parseInt(e.target.value))}
              className="w-full h-2 appearance-none rounded cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #00e400, #ffff00, #ff7e00, #ff0000, #8f3f97, #7e0023)',
              }}
            />

            <div className="grid grid-cols-3 gap-1">
              {AQI_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => setAqiThreshold(level.value)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-colors
                    ${level.color} bg-opacity-15 hover:bg-opacity-25 ${level.text}
                    ${aqiThreshold === level.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                  `}
                  title={level.label}
                >
                  {level.value}
                </button>
              ))}
            </div>

            <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {getAQILabel(aqiThreshold)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
