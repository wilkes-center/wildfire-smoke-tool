import React from 'react';
import { Wind } from 'lucide-react';

const PM25_LEVELS = [
  { value: 0, label: 'Good', color: '#00e400', position: 0 },
  { value: 12.1, label: 'Moderate', color: '#ffff00', position: 16.67 },
  { value: 35.5, label: 'USG', color: '#ff7e00', position: 33.33 },
  { value: 55.5, label: 'Unhealthy', color: '#ff0000', position: 50 },
  { value: 150.5, label: 'Very Unhealthy', color: '#8f3f97', position: 66.67 },
  { value: 250.5, label: 'Hazardous', color: '#7e0023', position: 83.33 },
  { value: 500, label: 'Hazardous', color: '#7e0023', position: 100 }
];

const PM25ThresholdSlider = ({ 
  pm25Threshold = 1,
  setPM25Threshold, 
  isDarkMode 
}) => {
  const valueToPosition = (value) => {
    for (let i = 0; i < PM25_LEVELS.length - 1; i++) {
      const currentLevel = PM25_LEVELS[i];
      const nextLevel = PM25_LEVELS[i + 1];
      
      if (value >= currentLevel.value && value < nextLevel.value) {
        const valueRange = nextLevel.value - currentLevel.value;
        const positionRange = nextLevel.position - currentLevel.position;
        const percent = (value - currentLevel.value) / valueRange;
        return currentLevel.position + (percent * positionRange);
      }
    }
    return 100;
  };

  const positionToValue = (position) => {
    for (let i = 0; i < PM25_LEVELS.length - 1; i++) {
      const currentLevel = PM25_LEVELS[i];
      const nextLevel = PM25_LEVELS[i + 1];
      
      if (position >= currentLevel.position && position < nextLevel.position) {
        const positionRange = nextLevel.position - currentLevel.position;
        const valueRange = nextLevel.value - currentLevel.value;
        const percent = (position - currentLevel.position) / positionRange;
        return currentLevel.value + (percent * valueRange);
      }
    }
    return 500;
  };

  const getCurrentLevel = (value) => {
    return PM25_LEVELS.find((level, index) => {
      const nextLevel = PM25_LEVELS[index + 1];
      return value >= level.value && (!nextLevel || value < nextLevel.value);
    });
  };

  const handleSliderChange = (e) => {
    const position = parseFloat(e.target.value);
    const value = positionToValue(position);
    setPM25Threshold(value);
  };

  const currentLevel = getCurrentLevel(pm25Threshold);
  const sliderPosition = valueToPosition(pm25Threshold);

  return (
    <div className={`backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 ${
      isDarkMode ? 'bg-gray-800/90 text-gray-200' : 'bg-white/90 text-gray-800'
    }`}>
      <div className="flex items-center gap-3">
        <Wind className="w-4 h-4" style={{ color: currentLevel?.color }} />
        <div className="flex-1 min-w-[140px]">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium">PM2.5</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: currentLevel?.color }}>
                {currentLevel?.label}
              </span>
              <span className="text-xs font-medium" style={{ color: currentLevel?.color }}>
                {pm25Threshold.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="relative">
            {/* Plain slider track with filled portion */}
            <div className={`absolute w-full h-1 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className={`h-full rounded-lg ${
                  isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
                }`}
                style={{ width: `${sliderPosition}%` }}
              />
            </div>

            {/* Main slider input (transparent) */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={sliderPosition}
              onChange={handleSliderChange}
              className="relative w-full h-1 rounded-lg appearance-none cursor-pointer bg-transparent z-10"
            />

            {/* Level markers */}
            <div className="absolute left-0 right-0 top-0 h-1 pointer-events-none">
              {PM25_LEVELS.slice(0, -1).map((level) => (
                <div
                  key={level.value}
                  className="absolute w-1 h-3 -mt-1 rounded-full"
                  style={{
                    left: `${level.position}%`,
                    transform: 'translateX(-50%)',
                    backgroundColor: level.color,
                    boxShadow: isDarkMode ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)'
                  }}
                  title={`${level.label} (${level.value})`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PM25ThresholdSlider;