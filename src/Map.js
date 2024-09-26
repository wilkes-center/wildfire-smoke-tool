import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

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
  const activeLayers = useRef([]);
  const [aqiThreshold, setAqiThreshold] = useState(100);

  const getTilesetId = (date) => {
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '') + '_' + date.getHours().toString().padStart(2, '0');
    return `pkulandh.aqi_${formattedDate}`;
  };

  const getLayerName = (date) => {
    return date.toISOString().slice(0, 10).replace(/-/g, '') + '_' + date.getHours().toString().padStart(2, '0');
  };

  const createLayerConfig = (tilesetId, layerName, opacity = 1) => ({
    id: `aqi-layer-${tilesetId}`,
    type: 'circle',
    source: `aqi-source-${tilesetId}`,
    'source-layer': layerName,
    filter: ['>', ['to-number', ['get', 'AQI']], aqiThreshold],
    paint: {
      'circle-radius': [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        2, 20,
        4, 20,
        5, 30,
        6, 35,
        7, 40,
        8, 40,
      ],
      'circle-color': [
        'interpolate',
        ['linear'],
        ['to-number', ['get', 'AQI'], 0],
        20, 'rgba(0, 228, 0, 0.1)',
        50, 'rgba(255, 255, 0, 0.1)',
        100, 'rgba(255, 126, 0, 0.1)',
        150, 'rgba(255, 0, 0, 0.1)',
        200, 'rgba(143, 63, 151, 0.1)',
        300, 'rgba(126, 0, 35, 0.1)',
        500, 'rgba(126, 0, 35, 0.1)'
      ],
      'circle-blur': [
        'interpolate',
        ['linear'],
        ['zoom'],
        2, 1,
        4, 0.8,
        6, 0.6,
        8, 0.4
      ],
      'circle-opacity': [
      'interpolate',
      ['linear'],
      ['to-number', ['get', 'AQI'], 0],
      0, ['*', 0.3, opacity],
      99, ['*', 0.3, opacity],
      100, opacity,
      500, opacity
    ]
    }
  });

  const addSourceAndLayer = (map, date, opacity = 1) => {
    const tilesetId = getTilesetId(date);
    const sourceId = `aqi-source-${tilesetId}`;
    const layerName = getLayerName(date);
    const layerId = `aqi-layer-${tilesetId}`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        url: `mapbox://${tilesetId}`,
      });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer(createLayerConfig(tilesetId, layerName, opacity));
    } else {
      map.setFilter(layerId, ['>', ['to-number', ['get', 'AQI']], aqiThreshold]);
    }

    return layerId;
  };

  const updateLayers = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const currentHour = currentTime.getHours();
    const layersToShow = [-1, 0, 1, 2].map(offset => {
      const time = new Date(currentTime);
      time.setHours(currentHour + offset);
      return { time, layerId: addSourceAndLayer(map, time, 0) };
    });

    // Update opacities
    layersToShow.forEach(({ time, layerId }, index) => {
      const timeDiff = (time.getTime() - currentTime.getTime()) / (60 * 60 * 1000);
      let opacity = 1 - Math.abs(timeDiff);
      opacity = Math.max(0, Math.min(1, opacity)); // Clamp between 0 and 1
      map.setPaintProperty(layerId, 'circle-opacity', opacity);
    });

    // Remove old layers
    activeLayers.current.forEach(layerId => {
      if (!layersToShow.some(layer => layer.layerId === layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId.replace('aqi-layer-', 'aqi-source-'));
      }
    });

    activeLayers.current = layersToShow.map(layer => layer.layerId);
  }, [currentTime, aqiThreshold]);

  useEffect(() => {
    if (mapRef.current) {
      updateLayers();
    }
  }, [currentTime, aqiThreshold, updateLayers]);

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

  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      updateLayers();
    }
  }, [updateLayers]);

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
    setAqiThreshold(parseInt(event.target.value));
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
            max="200"
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
            onLoad={onMapLoad}
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