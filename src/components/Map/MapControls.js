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
  getCurrentDateTime
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

  return (
    <div style={{ padding: '10px', background: '#f0f0f0' }}>
      <div>Current Date: {date}, Hour: {hour}:00</div>
      <div>
        <input
          type="range"
          min="0"
          max={TOTAL_HOURS - 1}
          value={currentHour < 12 ? currentHour : currentHour - 24}
          onChange={handleTimelineChange}
          style={{ width: '100%' }}
        />
      </div>
      <div>
        AQI Threshold: 
        <input
          type="range"
          min="0"
          max="500"
          value={aqiThreshold}
          onChange={(e) => setAqiThreshold(parseInt(e.target.value))}
          style={{ width: '200px', marginLeft: '10px' }}
        />
        {aqiThreshold}
      </div>
      <div>
        <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
        <span style={{ marginLeft: '10px' }}>Speed: </span>
        <button onClick={() => handleSpeedChange(1)} style={{ backgroundColor: playbackSpeed === 1 ? 'lightblue' : 'white' }}>1x</button>
        <button onClick={() => handleSpeedChange(2)} style={{ backgroundColor: playbackSpeed === 2 ? 'lightblue' : 'white' }}>2x</button>
        <button onClick={() => handleSpeedChange(3)} style={{ backgroundColor: playbackSpeed === 3 ? 'lightblue' : 'white' }}>3x</button>
      </div>
    </div>
  );
};

export default MapControls;