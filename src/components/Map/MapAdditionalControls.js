import React, { useEffect, useState, useRef } from 'react';
import { Map } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TILESET_INFO } from './constants';

const MapAdditionalControls = ({ 
  map, 
  mapStyle, 
  mapboxAccessToken, 
  polygon,
  currentDateTime,
  aqiThreshold 
}) => {
  const [minimapVisible, setMinimapVisible] = useState(false);
  const [minimapViewport, setMinimapViewport] = useState(null);
  const minimapRef = useRef(null);

  // Handle zoom controls
  const handleZoom = (direction) => {
    if (map) {
      const zoom = map.getZoom();
      map.easeTo({ zoom: direction === 'in' ? zoom + 1 : zoom - 1, duration: 300 });
    }
  };

  // Update viewport when polygon changes
  useEffect(() => {
    if (polygon && polygon.length > 0) {
      // Calculate bounds
      const bounds = polygon.reduce(
        (acc, [lng, lat]) => ({
          minLng: Math.min(acc.minLng, lng),
          maxLng: Math.max(acc.maxLng, lng),
          minLat: Math.min(acc.minLat, lat),
          maxLat: Math.max(acc.maxLat, lat),
        }),
        { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
      );

      // Add padding
      const padding = 0.2; // 20% padding
      const latSpan = bounds.maxLat - bounds.minLat;
      const lngSpan = bounds.maxLng - bounds.minLng;
      
      // Calculate base zoom level
      const baseZoom = Math.min(
        Math.log2(360 / (lngSpan * (1 + padding))) - 1,
        Math.log2(180 / (latSpan * (1 + padding))) - 1
      );

      const viewport = {
        latitude: (bounds.minLat + bounds.maxLat) / 2,
        longitude: (bounds.minLng + bounds.maxLng) / 2,
        zoom: baseZoom + 2, // Add 2 zoom levels for more detail
      };

      setMinimapViewport(viewport);
      setMinimapVisible(true);
    } else {
      setMinimapVisible(false);
    }
  }, [polygon]);

  // Setup minimap layers
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !currentDateTime) return;

    const setupLayers = () => {
      try {
        TILESET_INFO.forEach((tileset) => {
          const sourceId = `minimap-source-${tileset.id}`;
          const layerId = `minimap-layer-${tileset.id}`;

          // Add source if it doesn't exist
          if (!minimap.getSource(sourceId)) {
            minimap.addSource(sourceId, {
              type: 'vector',
              url: `mapbox://${tileset.id}`,
            });
          }

          // Add layer if it doesn't exist
          if (!minimap.getLayer(layerId)) {
            minimap.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              'source-layer': tileset.layer,
              paint: {
                // Adjusted circle radius for minimap scale
                'circle-radius': [
                  'interpolate',
                  ['exponential', 2],
                  ['zoom'],
                  4, 3,  // Smaller at low zoom
                  6, 5,  // Medium at mid zoom
                  8, 8,  // Larger at high zoom
                  10, 12 // Maximum size
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
                'circle-blur': 0.5,  // Reduced blur for sharper appearance
                'circle-opacity': 0.3, // Increased opacity for better visibility
              },
              layout: {
                'circle-sort-key': ['get', 'AQI'], // Sort by AQI to show higher values on top
              }
            });
          }

          // Update layer filter
          const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
          minimap.setFilter(layerId, [
            'all',
            ['==', ['get', 'time'], time],
            ['>=', ['to-number', ['get', 'AQI']], aqiThreshold]
          ]);
        });

        // Add polygon if it exists
        if (polygon) {
          const sourceId = 'minimap-polygon-source';
          const layerId = 'minimap-polygon-layer';
          const outlineLayerId = 'minimap-polygon-outline';
          
          // Clean up existing layers
          [layerId, outlineLayerId].forEach(id => {
            if (minimap.getLayer(id)) {
              minimap.removeLayer(id);
            }
          });
          
          if (minimap.getSource(sourceId)) {
            minimap.removeSource(sourceId);
          }

          // Add new source and layers
          minimap.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [polygon]
              }
            }
          });

          // Fill layer
          minimap.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': 'blue',
              'fill-opacity': 0.1,
            }
          });

          // Outline layer
          minimap.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': 'blue',
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
        }
      } catch (error) {
        console.error('Error setting up minimap layers:', error);
      }
    };

    // Wait for style to load before adding layers
    if (minimap.isStyleLoaded()) {
      setupLayers();
    } else {
      minimap.once('style.load', setupLayers);
    }

    // Cleanup function
    return () => {
      if (minimap && minimap.getStyle()) {
        try {
          TILESET_INFO.forEach((tileset) => {
            const layerId = `minimap-layer-${tileset.id}`;
            const sourceId = `minimap-source-${tileset.id}`;
            
            if (minimap.getLayer(layerId)) {
              minimap.removeLayer(layerId);
            }
            if (minimap.getSource(sourceId)) {
              minimap.removeSource(sourceId);
            }
          });
        } catch (error) {
          console.error('Error cleaning up minimap layers:', error);
        }
      }
    };
  }, [minimapRef.current, currentDateTime, aqiThreshold, polygon]);

  return (
    <>
      {/* Zoom controls */}
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
          style={{ 
            padding: '8px', 
            fontSize: '18px', 
            border: 'none', 
            borderBottom: '1px solid #ccc', 
            cursor: 'pointer', 
            borderRadius: '4px 4px 0 0',
            width: '30px'
          }}
        >
          +
        </button>
        <button
          onClick={() => handleZoom('out')}
          style={{ 
            padding: '8px', 
            fontSize: '18px', 
            border: 'none', 
            cursor: 'pointer', 
            borderRadius: '0 0 4px 4px',
            width: '30px'
          }}
        >
          -
        </button>
      </div>

      {/* Minimap */}
      {minimapVisible && minimapViewport && (
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
      )}
    </>
  );
};

export default MapAdditionalControls;