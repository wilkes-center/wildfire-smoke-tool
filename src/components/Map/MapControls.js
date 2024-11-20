import React, { useState, useEffect } from 'react';
import { Pen, X, Check, Gauge, Maximize2, ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';

const MapControls = ({
  currentHour,
  setCurrentHour,
  aqiThreshold,
  setAqiThreshold,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  getCurrentDateTime,
  drawingMode,
  startDrawing,
  finishDrawing,
  clearPolygon,
  polygon,
  map,
}) => {
  const { date, hour } = getCurrentDateTime();
  const [isThresholdExpanded, setIsThresholdExpanded] = useState(false);
  const [isSpeedExpanded, setIsSpeedExpanded] = useState(false);

  useEffect(() => {
    if (aqiThreshold < 20) {
      setAqiThreshold(20);
    }
  }, []);

  const handleAqiChange = (value) => {
    setAqiThreshold(Math.max(20, parseInt(value)));
  };

  const toggleThreshold = () => {
    setIsThresholdExpanded(!isThresholdExpanded);
    setIsSpeedExpanded(false);
  };

  const handleZoom = (direction) => {
    if (map) {
      const zoom = map.getZoom();
      map.easeTo({ zoom: direction === 'in' ? zoom + 1 : zoom - 1, duration: 300 });
    }
  };

  const handleRecenter = () => {
    if (map) {
      map.easeTo({
        center: [-98.5795, 39.8283],
        zoom: 4,
        duration: 1000
      });
    }
  };

  const buttonClass = "bg-white/90 hover:bg-white shadow-lg rounded-full p-4 transition-all duration-200 hover:scale-105 w-16 h-16 flex items-center justify-center";

  return (
    <>
      {/* DateTime Display - Top */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white/90 backdrop-blur-sm py-2 px-6 rounded-lg shadow-sm">
          <span className="text-3xl font-bold text-gray-800">
            {date} • {hour.toString().padStart(2, '0')}:00
          </span>
        </div>
      </div>

      {/* Left Side Controls - Top to bottom */}
      <div className="fixed top-6 left-6 z-10 flex flex-col gap-4">
        {/* Draw Controls */}
        <div className="w-16">
          {!drawingMode && !polygon && (
            <button
              onClick={startDrawing}
              className={buttonClass}
              title="Draw Area"
            >
              <Pen className="w-8 h-8 text-blue-600" />
            </button>
          )}
          {drawingMode && (
            <button
              onClick={finishDrawing}
              className={buttonClass}
              title="Finish Drawing"
            >
              <Check className="w-8 h-8 text-green-600" />
            </button>
          )}
          {polygon && !drawingMode && (
            <button
              onClick={clearPolygon}
              className={buttonClass}
              title="Clear Area"
            >
              <X className="w-8 h-8 text-red-600" />
            </button>
          )}
        </div>

        {/* Play Control with Speed Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            onMouseEnter={() => setIsSpeedExpanded(true)}
            className={`${buttonClass} ${isPlaying ? 'bg-red-50' : ''}`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-red-600" />
            ) : (
              <Play className="w-8 h-8 text-green-600" />
            )}
          </button>
          
          <div 
            className={`transition-all duration-300 overflow-hidden ${
              isSpeedExpanded ? 'w-32 opacity-100' : 'w-0 opacity-0'
            }`}
            onMouseLeave={() => setIsSpeedExpanded(false)}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-1">
              {[1, 2, 3].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackSpeed(speed);
                    setIsSpeedExpanded(false);
                  }}
                  className={`px-2 py-1 rounded-md text-sm transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Threshold Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleThreshold}
            className={`${buttonClass} ${isThresholdExpanded ? 'bg-blue-50' : ''}`}
            title="AQI Threshold"
          >
            <Gauge className="w-8 h-8 text-blue-600" />
          </button>
          <div className={`transition-all duration-300 overflow-hidden ${
            isThresholdExpanded ? 'w-40 opacity-100 ml-2' : 'w-0 opacity-0'
          }`}>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={Math.max(20, aqiThreshold)}
                  onChange={(e) => handleAqiChange(e.target.value)}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium w-8 text-gray-700">{aqiThreshold}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="w-16">
          <button
            onClick={() => handleZoom('in')}
            className={buttonClass}
            title="Zoom In"
          >
            <ZoomIn className="w-8 h-8 text-blue-600" />
          </button>
        </div>
        <div className="w-16">
          <button
            onClick={() => handleZoom('out')}
            className={buttonClass}
            title="Zoom Out"
          >
            <ZoomOut className="w-8 h-8 text-blue-600" />
          </button>
        </div>

        {/* Recenter Control */}
        <div className="w-16">
          <button
            onClick={handleRecenter}
            className={buttonClass}
            title="Reset View"
          >
            <Maximize2 className="w-8 h-8 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Timeline Control - Bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl mx-auto px-4">
        <div className="bg-white/40 backdrop-blur-md rounded-lg shadow-lg p-4">
          <div className="w-full px-2">
            <input
              type="range"
              min="0"
              max={95}
              value={currentHour}
              onChange={(e) => setCurrentHour(parseInt(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MapControls;