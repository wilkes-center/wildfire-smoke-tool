import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const MapComponent = () => {
  const [viewport, setViewport] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 3.5,
    minZoom: 2,
    maxZoom: 8,
  });

  const [currentTime, setCurrentTime] = useState(new Date('2024-09-15T03:00:00'));
  const [timeRange] = useState({
    min: new Date('2024-09-15T03:00:00'),
    max: new Date('2024-09-18T20:00:00'),
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const mapRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState('');
  const currentLayerRef = useRef(null);
  const nextLayerRef = useRef(null);

  const getTilesetId = (date) => {
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '') + '_' + date.getHours().toString().padStart(2, '0');
    return `pkulandh.aqi_${formattedDate}`;
  };

  const getLayerName = (date) => {
    return date.toISOString().slice(0, 10).replace(/-/g, '') + '_' + date.getHours().toString().padStart(2, '0');
  };

  const createLayerConfig = (tilesetId, layerName, opacity = 0.7) => ({
    id: `aqi-layer-${tilesetId}`,
    type: 'circle',
    source: `aqi-source-${tilesetId}`,
    'source-layer': layerName,
    filter: ['>', ['to-number', ['get', 'AQI']], 50],
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
        0, 'rgba(0, 228, 0, 0.4)',
        50, 'rgba(255, 255, 0, 0.4)',
        100, 'rgba(255, 126, 0, 0.4)',
        150, 'rgba(255, 0, 0, 0.4)',
        200, 'rgba(143, 63, 151, 0.4)',
        300, 'rgba(126, 0, 35, 0.4)',
        500, 'rgba(126, 0, 35, 0.4)'
      ],
      'circle-blur': 0.5,
      'circle-opacity': opacity
    }
  });

  const addSourceAndLayer = (map, date, opacity = 0.7) => {
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
    }

    return layerId;
  };

  const updateLayers = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const currentLayerId = addSourceAndLayer(map, currentTime, 1);
    
    const nextTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
    const nextLayerId = addSourceAndLayer(map, nextTime, 0.5);

    // Use setTimeout to ensure layers are added before updating properties
    setTimeout(() => {
      if (map.getLayer(currentLayerId)) {
        map.setPaintProperty(currentLayerId, 'circle-opacity', 0.7);
      }
      if (map.getLayer(nextLayerId)) {
        map.setPaintProperty(nextLayerId, 'circle-opacity', 0.5);
      }

      // Fade out the previous current layer
      if (currentLayerRef.current && currentLayerRef.current !== currentLayerId && map.getLayer(currentLayerRef.current)) {
        map.setPaintProperty(currentLayerRef.current, 'circle-opacity', 0);
        setTimeout(() => {
          if (map.getLayer(currentLayerRef.current)) {
            map.removeLayer(currentLayerRef.current);
            if (map.getSource(currentLayerRef.current.replace('aqi-layer-', 'aqi-source-'))) {
              map.removeSource(currentLayerRef.current.replace('aqi-layer-', 'aqi-source-'));
            }
          }
        }, 300);
      }

      // Update layer references
      currentLayerRef.current = currentLayerId;
      nextLayerRef.current = nextLayerId;

      setDebugInfo(prevInfo => `${prevInfo}\nUpdated to: ${getTilesetId(currentTime)}`);
    }, 100); // Short delay to ensure layers are added

  }, [currentTime]);

  useEffect(() => {
    if (mapRef.current) {
      updateLayers();
    }
  }, [currentTime, updateLayers]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = new Date(prevTime.getTime() + 60 * 60 * 1000); // Advance by 1 hour
          return newTime > timeRange.max ? timeRange.min : newTime;
        });
      }, 500); // Update every 0.5 seconds
      return () => clearInterval(interval);
    }
  }, [isPlaying, timeRange]);

  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      updateLayers();
    }
  }, [updateLayers]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
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

  const totalHours = Math.floor((timeRange.max - timeRange.min) / (1000 * 60 * 60));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          {...viewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/light-v10"
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={(evt) => setViewport(evt.viewState)}
          onLoad={onMapLoad}
          ref={mapRef}
          fadeDuration={300} // Smooth transition setting
        />
      </div>
      <div style={{ padding: '10px', background: '#f0f0f0' }}>
        <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
        <input
          type="range"
          min={0}
          max={totalHours}
          value={Math.floor((currentTime - timeRange.min) / (1000 * 60 * 60))}
          onChange={handleTimeChange}
          style={{ width: '100%' }}
        />
        <div style={{ textAlign: 'center' }}>
          Current Time: {formatTimeLabel(currentTime)}
        </div>
        <div style={{ marginTop: '10px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
          Debug Info:
          {debugInfo}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;