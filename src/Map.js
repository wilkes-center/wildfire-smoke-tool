import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoicGt1bGFuZGgiLCJhIjoiY20xNGZqbDBiMHhmdzJucHd5OTA4d2h2bCJ9.J6GeFa6bPfwMKqufI9L3MA';

console.log('Mapbox token:', MAPBOX_TOKEN);

const TILESET_INFO = [
  { id: 'pkulandh.aqi_20241014_00_to_20241014_05', layer: '20241014_00_to_20241014_05', date: '2024-10-14', startHour: 0 },
  { id: 'pkulandh.aqi_20241014_06_to_20241014_11', layer: '20241014_06_to_20241014_11', date: '2024-10-14', startHour: 6 },
  { id: 'pkulandh.aqi_20241015_12_to_20241015_17', layer: '20241015_12_to_20241015_17', date: '2024-10-15', startHour: 12 },
  { id: 'pkulandh.aqi_20241015_18_to_20241015_23', layer: '20241015_18_to_20241015_23', date: '2024-10-15', startHour: 18 },
  { id: 'pkulandh.aqi_20241016_00_to_20241016_05', layer: '20241016_00_to_20241016_05', date: '2024-10-16', startHour: 0 },
  { id: 'pkulandh.aqi_20241016_06_to_20241016_11', layer: '20241016_06_to_20241016_11', date: '2024-10-16', startHour: 6 },
  { id: 'pkulandh.aqi_20241016_12_to_20241016_17', layer: '20241016_12_to_20241016_17', date: '2024-10-16', startHour: 12 },
  { id: 'pkulandh.aqi_20241016_18_to_20241016_23', layer: '20241016_18_to_20241016_23', date: '2024-10-16', startHour: 18 },
  { id: 'pkulandh.aqi_20241017_00_to_20241017_05', layer: '20241017_00_to_20241017_05', date: '2024-10-17', startHour: 0 },
  { id: 'pkulandh.aqi_20241017_06_to_20241017_11', layer: '20241017_06_to_20241017_11', date: '2024-10-17', startHour: 6 },
  { id: 'pkulandh.aqi_20241017_12_to_20241017_17', layer: '20241017_12_to_20241017_17', date: '2024-10-17', startHour: 12 },
  { id: 'pkulandh.aqi_20241017_18_to_20241017_23', layer: '20241017_18_to_20241017_23', date: '2024-10-17', startHour: 18 },
  { id: 'pkulandh.aqi_20241018_00_to_20241018_05', layer: '20241018_00_to_20241018_05', date: '2024-10-18', startHour: 0 },
  { id: 'pkulandh.aqi_20241018_06_to_20241018_11', layer: '20241018_06_to_20241018_11', date: '2024-10-18', startHour: 6 },
  { id: 'pkulandh.aqi_20241018_12_to_20241018_17', layer: '20241018_12_to_20241018_17', date: '2024-10-18', startHour: 12 },
  { id: 'pkulandh.aqi_20241018_18_to_20241018_23', layer: '20241018_18_to_20241018_23', date: '2024-10-18', startHour: 18 },
];

const START_DATE = new Date('2024-10-14T00:00:00');
const END_DATE = new Date('2024-10-17T23:59:59');
const SKIPPED_HOURS = 24;
const TOTAL_HOURS = Math.floor((END_DATE - START_DATE) / (1000 * 60 * 60)) - SKIPPED_HOURS;

const MapComponent = () => {
  const [viewport, setViewport] = useState({
    latitude: 31.8283,
    longitude: -98.5795,
    zoom: 3,
    minZoom: 3,
    maxZoom: 8,
  });

  const [currentHour, setCurrentHour] = useState(0);
  const [aqiThreshold, setAqiThreshold] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const mapRef = useRef(null);

  const getCurrentDateTime = useCallback(() => {
    let adjustedHour = currentHour;
    if (adjustedHour >= 12) { 
      adjustedHour += SKIPPED_HOURS;
    }
    const currentDate = new Date(START_DATE.getTime() + adjustedHour * 60 * 60 * 1000);
    return {
      date: currentDate.toISOString().split('T')[0],
      hour: currentDate.getHours(),
    };
  }, [currentHour]);

  const updateLayers = useCallback((map) => {
    if (!map || !map.getStyle) return;
  
    try {
      const { date, hour } = getCurrentDateTime();
      const currentTime = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
  
      TILESET_INFO.forEach((tileset, index) => {
        const sourceId = `source-${tileset.id}`;
        const layerId = `layer-${tileset.id}`;
  
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'vector',
            url: `mapbox://${tileset.id}`,
          });
        }
  
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            'source-layer': tileset.layer,
            paint: {
              'circle-radius': [
                'interpolate',
                ['exponential', 1.5],
                ['zoom'],
                4, 15,
                5, 18,
                6, 30,
                7, 35,
                8, 40,
              ],
              'circle-color': [
                'interpolate',
                ['linear'],
                ['to-number', ['get', 'AQI'], 0],
                0, '#00e400',
                51, '#ffff00',
                101, '#ff7e00',
                151, '#ff0000',
                201, '#8f3f97',
                301, '#7e0023',
                500, '#7e0023'
              ],
              'circle-blur': 0.8,
              'circle-opacity': 0,
            },
          });
        }
  
        const layerStartTime = new Date(`${tileset.date}T${String(tileset.startHour).padStart(2, '0')}:00:00`);
        const layerEndTime = new Date(layerStartTime.getTime() + 6 * 60 * 60 * 1000);
        
        // Extend visibility window by 1 hour on each side for smooth transitions
        const extendedStartTime = new Date(layerStartTime.getTime() - 60 * 60 * 1000);
        const extendedEndTime = new Date(layerEndTime.getTime() + 60 * 60 * 1000);
  
        if (currentTime >= extendedStartTime && currentTime < extendedEndTime) {
          const currentHourInTileset = (currentTime.getTime() - layerStartTime.getTime()) / (60 * 60 * 1000);
          const formattedTime = `${tileset.date}T${String(tileset.startHour + Math.floor(currentHourInTileset)).padStart(2, '0')}:00:00`;
  
          const filter = [
            'all',
            ['==', ['get', 'time'], formattedTime],
            ['>=', ['to-number', ['get', 'AQI']], aqiThreshold]
          ];
  
          map.setFilter(layerId, filter);
  
          // Calculate opacity for smooth transition


          let opacity;
          if (currentTime < layerStartTime) {
            // Fade in
            opacity = 1 - (layerStartTime - currentTime) / (60 * 60 * 1000);
          } else if (currentTime >= layerEndTime) {
            // Fade out
            opacity = 1 - (currentTime - layerEndTime) / (60 * 60 * 1000);
          } else {
            // Full opacity during the main 6-hour period
            opacity = 1;
          }
  
          // Ensure opacity is between 0 and 1
          opacity = Math.max(0, Math.min(1, opacity));
  
          map.setPaintProperty(layerId, 'circle-opacity', opacity);
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        } else {
          // Hide layers outside the extended time range
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });
  
    } catch (error) {
      console.error('Error updating layers:', error);
    }
  }, [aqiThreshold, getCurrentDateTime]);


  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map && isMapLoaded) {
      updateLayers(map);
    }
  }, [updateLayers, isMapLoaded, currentHour]);

  useEffect(() => {
    let animationFrame;
    let lastTimestamp = 0;
    const animationDuration = 1000 / playbackSpeed;

    const animate = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;

      if (elapsed >= animationDuration) {
        setCurrentHour((prevHour) => {
          let nextHour = (prevHour + 1) % TOTAL_HOURS;
          if (nextHour === 12) {
            nextHour = 36;
          }
          return nextHour;
        });
        lastTimestamp = timestamp;
      }

      if (isPlaying) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, playbackSpeed]);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
    console.log('Map loaded');
  }, []);

  const handleMapInteraction = useCallback((evt) => {
    try {
      if (isMapLoaded) {
        setViewport(evt.viewState);
        setCurrentZoom(evt.viewState.zoom);
      }
    } catch (error) {
      console.error('Error during map interaction:', error);
    }
  }, [isMapLoaded]);

  const handleAqiThresholdChange = (event) => {
    const newThreshold = parseInt(event.target.value);
    setAqiThreshold(newThreshold);
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          {...viewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/light-v10"
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={handleMapInteraction}
          ref={mapRef}
          onLoad={handleMapLoad}
        />
        {!isMapLoaded && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.8)',
          }}>
            Loading map...
          </div>
        )}
      </div>
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
            onChange={handleAqiThresholdChange}
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
    </div>
  );
};

export default MapComponent;