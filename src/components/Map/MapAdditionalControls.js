import React, { useEffect, useState, useRef } from 'react';
import { Map } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TILESET_INFO } from './constants';

const MapAdditionalControls = ({ map, mapStyle, mapboxAccessToken, polygon, currentDateTime, aqiThreshold }) => {
  const [minimapViewport, setMinimapViewport] = useState({
    latitude: map?.getCenter().lat,
    longitude: map?.getCenter().lng,
    zoom: map?.getZoom() - 4,
  });
  const minimapRef = useRef(null);

  const handleZoom = (direction) => {
    if (map) {
      const zoom = map.getZoom();
      map.easeTo({ zoom: direction === 'in' ? zoom + 1 : zoom - 1, duration: 300 });
    }
  };

  useEffect(() => {
    if (polygon && polygon.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      polygon.forEach(coord => bounds.extend(coord));
      const center = bounds.getCenter();
      const { _sw, _ne } = bounds;
      const maxDim = Math.max(_ne.lng - _sw.lng, _ne.lat - _sw.lat);
      const zoom = Math.log2(360 / (maxDim * Math.cos(center.lat * Math.PI / 180))) - 1;
      const paddedZoom = zoom - 0.5;

      setMinimapViewport({
        latitude: center.lat,
        longitude: center.lng,
        zoom: paddedZoom,
      });
    }
  }, [polygon]);

  useEffect(() => {
    if (minimapRef.current && polygon) {
      const minimap = minimapRef.current.getMap();

      // Remove existing layers and sources
      if (minimap.getLayer('polygon-layer')) minimap.removeLayer('polygon-layer');
      if (minimap.getLayer('polygon-outline')) minimap.removeLayer('polygon-outline');
      if (minimap.getSource('polygon-source')) minimap.removeSource('polygon-source');

      // Add polygon source and layers
      minimap.addSource('polygon-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [polygon]
          }
        }
      });

      minimap.addLayer({
        id: 'polygon-layer',
        type: 'fill',
        source: 'polygon-source',
        paint: {
          'fill-color': 'blue',
          'fill-opacity': 0.2
        }
      });

      minimap.addLayer({
        id: 'polygon-outline',
        type: 'line',
        source: 'polygon-source',
        paint: {
          'line-color': 'blue',
          'line-width': 2
        }
      });

      // Fit the minimap to the polygon bounds
      const bounds = new mapboxgl.LngLatBounds();
      polygon.forEach(coord => bounds.extend(coord));
      minimap.fitBounds(bounds, { padding: 20 });
    }
  }, [polygon, minimapViewport]);

  useEffect(() => {
    if (minimapRef.current && currentDateTime) {
      const minimap = minimapRef.current.getMap();
      const { date, hour } = currentDateTime;

      TILESET_INFO.forEach((tileset) => {
        const sourceId = `source-${tileset.id}`;
        const layerId = `layer-${tileset.id}`;

        // Add source if it doesn't exist
        if (!minimap.getSource(sourceId)) {
          minimap.addSource(sourceId, {
            type: 'vector',
            url: `mapbox://${tileset.id}`,
          });
        }

        // Add or update layer
        const layerConfig = {
          id: layerId,
          type: 'circle',
          source: sourceId,
          'source-layer': tileset.layer,
          paint: {
            'circle-radius': [
              'interpolate',
              ['exponential', 3],
              ['zoom'],
              4, 25,
              5, 30,
              6, 35,
              7, 40,
              8, 45,
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
            'circle-blur': 0.9,
            'circle-opacity': 0.15,
          },
        };

        if (minimap.getLayer(layerId)) {
          minimap.removeLayer(layerId);
        }
        minimap.addLayer(layerConfig);

        // Set filter based on current date, hour, and AQI threshold
        const tilesetDate = new Date(tileset.date);
        const currentDate = new Date(date);
        if (currentDate.getTime() === tilesetDate.getTime() && 
            hour >= tileset.startHour && 
            hour < tileset.startHour + 6) {
          const filter = [
            'all',
            ['==', ['get', 'time'], `${date}T${String(hour).padStart(2, '0')}:00:00`],
            ['>=', ['to-number', ['get', 'AQI']], aqiThreshold]
          ];
          minimap.setFilter(layerId, filter);
          minimap.setLayoutProperty(layerId, 'visibility', 'visible');
        } else {
          minimap.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });
    }
  }, [currentDateTime, aqiThreshold]);

  return (
    <>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'white', 
        borderRadius: '4px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        <button
          onClick={() => handleZoom('in')}
          style={{ padding: '8px', fontSize: '18px', border: 'none', borderBottom: '1px solid #ccc', cursor: 'pointer', borderRadius: '4px 4px 0 0' }}
        >
          +
        </button>
        <button
          onClick={() => handleZoom('out')}
          style={{ padding: '8px', fontSize: '18px', border: 'none', cursor: 'pointer', borderRadius: '0 0 4px 4px' }}
        >
          -
        </button>
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        width: '200px', 
        height: '200px', 
        border: '2px solid white', 
        borderRadius: '4px', 
        overflow: 'hidden', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)' 
      }}>
        <Map
          ref={minimapRef}
          initialViewState={minimapViewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle}
          mapboxAccessToken={mapboxAccessToken}
          interactive={false}
        />
      </div>
    </>
  );
};

export default MapAdditionalControls;