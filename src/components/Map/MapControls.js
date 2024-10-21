import React from 'react';
import { TOTAL_HOURS } from './constants';

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
  polygon
}) => {
  const handleTimelineChange = (event) => {
    let newHour = parseInt(event.target.value);
    if (newHour >= 12) {
      newHour += 24;
    }
    setCurrentHour(newHour);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const { date, hour } = getCurrentDateTime();

  const buttonStyle = {
    padding: '8px 16px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s, transform 0.1s',
  };

  const playPauseStyle = {
    ...buttonStyle,
    backgroundColor: isPlaying ? '#ff4757' : '#2ed573',
    color: 'white',
  };

  const speedButtonStyle = (speed) => ({
    ...buttonStyle,
    backgroundColor: playbackSpeed === speed ? '#54a0ff' : '#dfe6e9',
    color: playbackSpeed === speed ? 'white' : 'black',
  });

  const drawPolygonStyle = {
    ...buttonStyle,
    backgroundColor: drawingMode ? '#ff9ff3' : '#54a0ff',
    color: 'white',
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '15px',
      background: '#f0f0f0',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px',
      maxWidth: '90%',
      width: '800px',
    }}>
      <div style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
        Current Date: {date}, Hour: {hour}:00
      </div>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="range"
          min="0"
          max={TOTAL_HOURS - 1}
          value={currentHour < 12 ? currentHour : currentHour - 24}
          onChange={handleTimelineChange}
          style={{ flex: 1 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <div>
          <button onClick={togglePlay} style={playPauseStyle}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
        <div>
          <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Speed:</span>
          <button onClick={() => handleSpeedChange(1)} style={speedButtonStyle(1)}>1x</button>
          <button onClick={() => handleSpeedChange(2)} style={speedButtonStyle(2)}>2x</button>
          <button onClick={() => handleSpeedChange(3)} style={speedButtonStyle(3)}>3x</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>AQI Threshold:</label>
          <input
            type="range"
            min="0"
            max="500"
            value={aqiThreshold}
            onChange={(e) => setAqiThreshold(parseInt(e.target.value))}
            style={{ width: '120px', marginRight: '10px', verticalAlign: 'middle' }}
          />
          <span style={{ fontWeight: 'bold', minWidth: '30px', textAlign: 'right' }}>{aqiThreshold}</span>
        </div>
        <div>
          {!drawingMode && !polygon && (
            <button onClick={startDrawing} style={drawPolygonStyle}>
              Draw Polygon
            </button>
          )}
          {drawingMode && (
            <button onClick={finishDrawing} style={drawPolygonStyle}>
              Finish Drawing
            </button>
          )}
          {polygon && !drawingMode && (
            <button onClick={clearPolygon} style={{...drawPolygonStyle, backgroundColor: '#ff6b6b'}}>
              Clear Polygon
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapControls;