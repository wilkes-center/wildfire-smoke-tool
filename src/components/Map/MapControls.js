import React, { useState, useEffect, useRef } from 'react';
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
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const speedControlsTimeoutRef = useRef(null);
  const speedControlsRef = useRef(null);

  useEffect(() => {
    if (aqiThreshold < 20) {
      setAqiThreshold(20);
    }
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (speedControlsTimeoutRef.current) {
        clearTimeout(speedControlsTimeoutRef.current);
      }
    };
  }, []);

  const handleSpeedControlsMouseEnter = () => {
    if (speedControlsTimeoutRef.current) {
      clearTimeout(speedControlsTimeoutRef.current);
    }
    setShowSpeedOptions(true);
  };

  const handleSpeedControlsMouseLeave = () => {
    speedControlsTimeoutRef.current = setTimeout(() => {
      // Only hide if the mouse isn't over the controls
      if (speedControlsRef.current && !speedControlsRef.current.matches(':hover')) {
        setShowSpeedOptions(false);
      }
    }, 300); // 300ms delay before hiding
  };

  const handleAqiChange = (value) => {
    setAqiThreshold(Math.max(20, parseInt(value)));
  };

  const toggleThreshold = () => {
    setIsThresholdExpanded(!isThresholdExpanded);
  };

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedSelect = (speed) => {
    setPlaybackSpeed(speed);
    // Don't hide immediately after selection
    if (speedControlsTimeoutRef.current) {
      clearTimeout(speedControlsTimeoutRef.current);
    }
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

  const buttonClass = "bg-white/40 hover:bg-white shadow-lg rounded-full p-4 transition-all duration-200 hover:scale-105 w-14 h-14 flex items-center justify-center";
  const largeButtonClass = "bg-white/40 hover:bg-white shadow-lg rounded-full p-4 transition-all duration-200 hover:scale-105 w-20 h-20 flex items-center justify-center";

  return (
    <>
      {/* DateTime Display - Top */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white/40 backdrop-blur-sm py-2 px-6 rounded-lg shadow-sm">
          <span className="text-4xl font-bold text-gray-800">
            {date} • {hour.toString().padStart(2, '0')}:00
          </span>
        </div>
      </div>

      {/* Left Side Controls */}
      <div className="fixed top-6 left-6 z-10 flex flex-col gap-4">
        {/* Draw Controls */}
        <div className="w-20">
          {!drawingMode && !polygon && (
            <button onClick={startDrawing} className={largeButtonClass} title="Draw Polygon">
              <Pen className="w-10 h-10 to-black" />
            </button>
          )}
          {drawingMode && (
            <button onClick={finishDrawing} className={largeButtonClass} title="Finish Drawing">
              <Check className="w-10 h-10 text-green-600" />
            </button>
          )}
          {polygon && !drawingMode && (
            <button onClick={clearPolygon} className={largeButtonClass} title="Clear Area">
              <X className="w-10 h-10 text-red-600" />
            </button>
          )}
        </div>

        {/* Threshold Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleThreshold}
            className={`${buttonClass} ${isThresholdExpanded ? 'bg-blue-50' : ''}`}
            title="AQI Threshold"
          >
            <Gauge className="w-8 h-8 black" />
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
          <button onClick={() => handleZoom('in')} className={buttonClass} title="Zoom In">
            <ZoomIn className="w-8 h-8 black" />
          </button>
        </div>
        <div className="w-16">
          <button onClick={() => handleZoom('out')} className={buttonClass} title="Zoom Out">
            <ZoomOut className="w-8 h-8 black" />
          </button>
        </div>

        {/* Recenter Control */}
        <div className="w-16">
          <button onClick={handleRecenter} className={buttonClass} title="Reset View">
            <Maximize2 className="w-8 h-8 black" />
          </button>
        </div>
      </div>

      {/* Timeline Control with Play Button - Bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-4">
          {/* Larger Play Control with Speed Options */}
          <div
            className="relative"
            onMouseEnter={handleSpeedControlsMouseEnter}
            onMouseLeave={handleSpeedControlsMouseLeave}
          >
            <button
              onClick={handlePlayClick}
              className={`rounded-full p-3 transition-colors ${
                isPlaying ? 'bg-red-50' : 'bg-white/90'
              } w-14 h-14 flex items-center justify-center shadow-lg`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-red-600" />
              ) : (
                <Play className="w-8 h-8 text-green-600" />
              )}
            </button>

            {showSpeedOptions && isPlaying && (
              <div
                ref={speedControlsRef}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2"
                onMouseEnter={handleSpeedControlsMouseEnter}
                onMouseLeave={handleSpeedControlsMouseLeave}
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-1">
                  {[1, 2, 3].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedSelect(speed)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
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
            )}
          </div>

          {/* Timeline Slider */}
          <div className="flex-1">
            <div className="bg-white/40 backdrop-blur-md rounded-lg shadow-lg p-4">
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
      </div>
    </>
  );
};

export default MapControls;