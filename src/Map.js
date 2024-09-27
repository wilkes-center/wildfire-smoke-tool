import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
const TRANSITION_DURATION = 300; // milliseconds

const MapComponent = () => {
  const [viewport, setViewport] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4,
    minZoom: 4,
    maxZoom: 8,
  });

  const [currentTime, setCurrentTime] = useState(new Date('2024-09-15T03:00:00'));
  const [timeRange] = useState({
    min: new Date('2024-09-15T03:00:00'),
    max: new Date('2024-09-18T20:00:00'),
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const mapRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(3.5);
  const [aqiThreshold, setAqiThreshold] = useState(100);

  const getTilesetId = useCallback((date) => {
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '') + '_' + date.getHours().toString().padStart(2, '0');
    return `pkulandh.aqi_${formattedDate}`;
  }, []);

  const getLayerName = useCallback((date) => {
    return date.toISOString().slice(0, 10).replace(/-/g, '') + '_' + date.getHours().toString().padStart(2, '0');
  }, []);

  const updateLayer = useCallback((map, date) => {
    const tilesetId = getTilesetId(date);
    const layerName = getLayerName(date);
    const sourceId = `source-${tilesetId}`;
    const layerId = `layer-${tilesetId}`;

    // Add new source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        url: `mapbox://${tilesetId}`,
      });
    }

    // Prepare the new layer
    const newLayerConfig = {
      id: layerId,
      type: 'circle',
      source: sourceId,
      'source-layer': layerName,
      filter: ['>', ['to-number', ['get', 'AQI']], aqiThreshold],
      paint: {
        'circle-radius': [
          'interpolate',
          ['exponential', 1.5],
          ['zoom'],
          2, 2,
          4, 3,
          5, 7,
          6, 9,
          7, 11,
          8, 13,
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['to-number', ['get', 'AQI'], 0],
          20, 'rgb(0, 228, 0)',
          50, 'rgb(255, 255, 0)',
          100, 'rgb(255, 126, 0)',
          150, 'rgb(255, 0, 0)',
          200, 'rgb(143, 63, 151)',
          300, 'rgb(126, 0, 35)',
          500, 'rgb(126, 0, 35)'
        ],
        'circle-blur': 0.4,
        'circle-opacity': 0,
      },
    };

    // Add the new layer if it doesn't exist
    if (!map.getLayer(layerId)) {
      map.addLayer(newLayerConfig);
    }

    // Fade out all other layers
    map.getStyle().layers.forEach(layer => {
      if (layer.id.startsWith('layer-') && layer.id !== layerId) {
        map.setPaintProperty(layer.id, 'circle-opacity', 0, {
          duration: TRANSITION_DURATION,
        });
      }
    });

    // Fade in the new layer
    map.setPaintProperty(layerId, 'circle-opacity', 0.7, {
      duration: TRANSITION_DURATION,
    });

    // Remove faded out layers and their sources after transition
    setTimeout(() => {
      map.getStyle().layers.forEach(layer => {
        if (layer.id.startsWith('layer-') && layer.id !== layerId) {
          map.removeLayer(layer.id);
          map.removeSource(layer.source);
        }
      });
    }, TRANSITION_DURATION);

  }, [getTilesetId, getLayerName, aqiThreshold]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      updateLayer(map, currentTime);
    }
  }, [currentTime, updateLayer]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = new Date(prevTime.getTime() + 60 * 60 * 1000);
          return newTime > timeRange.max ? timeRange.min : newTime;
        });
      }, 1000 / playbackSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, timeRange, playbackSpeed]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const handleTimeChange = (event) => {
    const totalHours = parseInt(event.target.value);
    const newTime = new Date(timeRange.min);
    newTime.setHours(newTime.getHours() + totalHours);
    setCurrentTime(newTime);
  };

  const formatTimeLabel = (date) => {
    return date.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAqiThresholdChange = (event) => {
    const newThreshold = parseInt(event.target.value);
    setAqiThreshold(newThreshold);
    const map = mapRef.current?.getMap();
    if (map) {
      map.getStyle().layers.forEach(layer => {
        if (layer.id.startsWith('layer-')) {
          map.setFilter(layer.id, ['>', ['to-number', ['get', 'AQI']], newThreshold]);
        }
      });
    }
  };

  const totalHours = Math.floor((timeRange.max - timeRange.min) / (1000 * 60 * 60));

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ width: '250px', padding: '10px', background: '#f0f0f0', overflowY: 'auto' }}>
        <h3>Zoom Info</h3>
        <div>Current Zoom: {currentZoom.toFixed(2)}</div>
        <h3>AQI Threshold</h3>
        <div>
          <input
            type="range"
            min="0"
            max="500"
            value={aqiThreshold}
            onChange={handleAqiThresholdChange}
            style={{ width: '100%' }}
          />
          <div>Current Threshold: {aqiThreshold}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Map
            {...viewport}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v10"
            mapboxAccessToken={MAPBOX_TOKEN}
            onMove={(evt) => {
              setViewport(evt.viewState);
              setCurrentZoom(evt.viewState.zoom);
            }}
            ref={mapRef}
          />
        </div>
        <div style={{ padding: '10px', background: '#f0f0f0' }}>
          <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
          <span style={{ marginLeft: '10px' }}>Speed: </span>
          <button onClick={() => handleSpeedChange(1)} style={{ backgroundColor: playbackSpeed === 1 ? 'lightblue' : 'white' }}>1x</button>
          <button onClick={() => handleSpeedChange(2)} style={{ backgroundColor: playbackSpeed === 2 ? 'lightblue' : 'white' }}>2x</button>
          <button onClick={() => handleSpeedChange(3)} style={{ backgroundColor: playbackSpeed === 3 ? 'lightblue' : 'white' }}>3x</button>
          <input
            type="range"
            min={0}
            max={totalHours}
            value={Math.floor((currentTime - timeRange.min) / (1000 * 60 * 60))}
            onChange={handleTimeChange}
            style={{ width: '100%', marginTop: '10px' }}
          />
          <div style={{ textAlign: 'center' }}>
            Current Time: {formatTimeLabel(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;