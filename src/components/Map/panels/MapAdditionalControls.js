import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map } from 'react-map-gl';
import { Map as MapIcon, X } from 'lucide-react';
import { TILESET_INFO } from '../../../utils/map/constants.js';
import { Tooltip } from '../Tooltip';

const MapAdditionalControls = ({ 
  map, 
  mapStyle, 
  mapboxAccessToken, 
  polygon,
  currentDateTime,
  isDarkMode,
  pm25Threshold,
  onExpandChange
}) => {
  const [minimapVisible, setMinimapVisible] = useState(false);
  const [minimapViewport, setMinimapViewport] = useState(null);
  const minimapRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const layersInitializedRef = useRef(false);

  // Auto-expand when polygon is selected
  useEffect(() => {
    if (polygon) {
      setIsExpanded(true);
      onExpandChange?.(true);
    } else {
      setIsExpanded(false);
      onExpandChange?.(false);
    }
  }, [polygon, onExpandChange]);

  const setupMinimapLayers = useCallback((minimap) => {
    if (!minimap || !currentDateTime) return;

    try {
      console.log('Setting up minimap layers with datetime:', currentDateTime);
      // Clean up existing layers
      TILESET_INFO.forEach((tileset) => {
        const sourceId = `minimap-source-${tileset.id}`;
        const layerId = `minimap-layer-${tileset.id}`;

        if (minimap.getLayer(layerId)) {
          minimap.removeLayer(layerId);
        }
        if (minimap.getSource(sourceId)) {
          minimap.removeSource(sourceId);
        }
      });

      // Add new layers with matching styles from main map
      TILESET_INFO.forEach((tileset) => {
        const sourceId = `minimap-source-${tileset.id}`;
        const layerId = `minimap-layer-${tileset.id}`;

        minimap.addSource(sourceId, {
          type: 'vector',
          url: `mapbox://${tileset.id}`,
        });

        minimap.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          'source-layer': tileset.layer,
          paint: {
            'circle-radius': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              4, 4,
              5, 8,
              6, 16,
              7, 32,
              8, 64,
              9, 96
            ],
            'circle-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['to-number', ['get', 'AQI'], 0], 0],
              0, '#00e400',
              51, '#ffff00',
              101, '#ff7e00',
              151, '#ff0000',
              201, '#8f3f97',
              301, '#7e0023'
            ],
            'circle-blur': 0.9,
            'circle-opacity': 0.4
          }
        });

        const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
        // Initial filter just checks time
        const filter = [
          'all',
          ['==', ['get', 'time'], time]
        ];
        minimap.setFilter(layerId, filter);
      });

      console.log('Successfully set up minimap layers');
      layersInitializedRef.current = true;
    } catch (error) {
      console.error('Error setting up minimap layers:', error);
    }
  }, [currentDateTime]);

  const handleMinimapLoad = useCallback(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap) return;

    minimap.on('style.load', () => {
      console.log('Minimap style loaded, initializing layers');
      layersInitializedRef.current = false;
      setupMinimapLayers(minimap);
    });

    if (minimap.isStyleLoaded()) {
      setupMinimapLayers(minimap);
    }
  }, [setupMinimapLayers]);

  // Update layers when time or threshold changes
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (minimap && minimap.isStyleLoaded()) {
      const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
      
      TILESET_INFO.forEach((tileset) => {
        const layerId = `minimap-layer-${tileset.id}`;
        if (minimap.getLayer(layerId)) {
          const filter = [
            'all',
            ['==', ['get', 'time'], time],
            ['>=', ['coalesce', ['to-number', ['get', 'AQI'], 0], 0], pm25Threshold]
          ];
          minimap.setFilter(layerId, filter);
        }
      });
    }
  }, [currentDateTime, pm25Threshold]);

  // Calculate and set viewport when polygon changes
  useEffect(() => {
    if (polygon && polygon.length > 0) {
      const bounds = polygon.reduce(
        (acc, [lng, lat]) => ({
          minLng: Math.min(acc.minLng, lng),
          maxLng: Math.max(acc.maxLng, lng),
          minLat: Math.min(acc.minLat, lat),
          maxLat: Math.max(acc.maxLat, lat),
        }),
        { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
      );

      const center = {
        latitude: (bounds.minLat + bounds.maxLat) / 2,
        longitude: (bounds.minLng + bounds.maxLng) / 2
      };

      const latSpan = bounds.maxLat - bounds.minLat;
      const lngSpan = bounds.maxLng - bounds.minLng;
      const padding = 0.4;
      const paddedLatSpan = latSpan * (1 + padding);
      const paddedLngSpan = lngSpan * (1 + padding);

      const latZoom = Math.log2(180 / (paddedLatSpan + 0.0001));
      const lngZoom = Math.log2(360 / (paddedLngSpan + 0.0001));
      const zoom = Math.min(latZoom, lngZoom);

      setMinimapViewport({
        ...center,
        zoom: Math.min(Math.max(zoom, 3), 10),
        minZoom: 2,
        maxZoom: 9
      });
      setMinimapVisible(true);
    } else {
      setMinimapVisible(false);
    }
  }, [polygon]);

  // Add polygon overlay to minimap
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !polygon) return;

    const sourceId = 'minimap-polygon-source';
    const layerId = 'minimap-polygon-layer';

    const addPolygonLayer = () => {
      if (minimap.getSource(sourceId)) {
        minimap.removeLayer(layerId);
        minimap.removeSource(sourceId);
      }

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

      minimap.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#3B82F6',
          'line-width': 2
        }
      });
    };

    if (minimap.isStyleLoaded()) {
      addPolygonLayer();
    } else {
      minimap.once('style.load', addPolygonLayer);
    }

    return () => {
      if (minimap.getLayer(layerId)) {
        minimap.removeLayer(layerId);
      }
      if (minimap.getSource(sourceId)) {
        minimap.removeSource(sourceId);
      }
    };
  }, [polygon]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Tooltip content="View area overview" position="left">
        <button
          className="bg-white/70 rounded-lg shadow-md hover:bg-gray-50/70 transition-colors w-12 h-12 flex items-center justify-center backdrop-blur-sm"
          onClick={() => {
            const newExpandedState = !isExpanded;
            setIsExpanded(newExpandedState);
            onExpandChange?.(newExpandedState);
          }}
          disabled={!polygon}
        >
          {!isExpanded ? (
            <MapIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <X className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </Tooltip>
      
      {isExpanded && minimapVisible && minimapViewport && (
        <div className="absolute top-14 right-0 w-[480px] h-[400px] bg-white/40 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          <div className="w-full h-full">
            <div className="border-b border-gray-200/40 px-3 py-2 bg-white/30">
              <h2 className="text-xl font-bold leading-none text-gray-800">Area Overview</h2>
            </div>
            
            <div className="h-[360px] relative">
              <Map
                ref={minimapRef}
                initialViewState={minimapViewport}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                mapboxAccessToken={mapboxAccessToken}
                interactive={false}
                onLoad={handleMinimapLoad}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapAdditionalControls;