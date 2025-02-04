import React from 'react';
import { Wind } from 'lucide-react';

const PM25ThresholdSlider = ({ pm25Threshold, setPM25Threshold, isDarkMode }) => {
  const getThresholdColor = (value) => {
    if (value <= 12.0) return '#00e400';  // Good
    if (value <= 35.4) return '#ffff00';  // Moderate
    if (value <= 55.4) return '#ff7e00';  // Unhealthy for Sensitive Groups
    if (value <= 150.4) return '#ff0000'; // Unhealthy
    if (value <= 250.4) return '#8f3f97'; // Very Unhealthy
    return '#7e0023';                     // Hazardous
  };

  return (
    <div className={`backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 ${
      isDarkMode ? 'bg-gray-800/95 text-gray-200' : 'bg-white/95 text-gray-800'
    }`}>
      <div className="flex items-center gap-2">
        <Wind className="w-4 h-4 text-gray-400" />
        <div className="flex flex-col gap-1 min-w-[140px]">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">PM2.5</span>
            <span 
              className="text-xs font-medium" 
              style={{ color: getThresholdColor(pm25Threshold) }}
            >
              {pm25Threshold.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="0.1"
            value={pm25Threshold}
            onChange={(e) => setPM25Threshold(parseFloat(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #00e400, #ffff00, #ff7e00, #ff0000, #8f3f97, #7e0023)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PM25ThresholdSlider;