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
  const previousLayersRef = useRef(new Set());

  // Auto-expand when polygon is drawn
  useEffect(() => {
    if (polygon) {
      setIsExpanded(true);
      onExpandChange?.(true);
      setMinimapVisible(true);
    } else {
      setIsExpanded(false);
      onExpandChange?.(false);
      setMinimapVisible(false);
    }
  }, [polygon, onExpandChange]);

  const setupMinimapLayers = useCallback((minimap) => {
    if (!minimap || !map || !currentDateTime) return;

    try {
      // Get all visible layers from the main map
      const style = map.getStyle();
      const visibleLayers = style.layers.filter(layer => 
        layer.id.startsWith('layer-') && 
        map.getLayoutProperty(layer.id, 'visibility') === 'visible'
      );

      // Clean up existing layers
      previousLayersRef.current.forEach(layerId => {
        if (minimap.getLayer(layerId)) {
          minimap.removeLayer(layerId);
        }
        const sourceId = layerId.replace('layer', 'source');
        if (minimap.getSource(sourceId)) {
          minimap.removeSource(sourceId);
        }
      });
      previousLayersRef.current.clear();

      // Mirror each visible layer from the main map
      visibleLayers.forEach(layer => {
        const sourceId = layer.source;
        const minimapSourceId = `minimap-${sourceId}`;
        const minimapLayerId = `minimap-${layer.id}`;

        // Add source if it doesn't exist
        if (!minimap.getSource(minimapSourceId)) {
          const sourceData = style.sources[sourceId];
          minimap.addSource(minimapSourceId, sourceData);
        }

        // Add layer with synchronized properties
        if (!minimap.getLayer(minimapLayerId)) {
          const layerConfig = {
            ...layer,
            id: minimapLayerId,
            source: minimapSourceId,
            paint: {
              ...layer.paint,
              'circle-radius': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                4, 2,
                5, 5,
                6, 10,
                7, 25,
                8, 50,
                9, 90
              ]
            }
          };
          minimap.addLayer(layerConfig);
          previousLayersRef.current.add(minimapLayerId);

          // Mirror the filter from the main map
          const filter = map.getFilter(layer.id);
          if (filter) {
            minimap.setFilter(minimapLayerId, filter);
          }
        }
      });

      layersInitializedRef.current = true;
    } catch (error) {
      console.error('Error setting up minimap layers:', error);
    }
  }, [map, currentDateTime]);

  // Handle minimap load and updates
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !map) return;

    const handleStyleLoad = () => {
      setupMinimapLayers(minimap);
    };

    const handleMainMapUpdate = () => {
      if (minimap.isStyleLoaded()) {
        setupMinimapLayers(minimap);
      }
    };

    if (minimap.isStyleLoaded()) {
      handleStyleLoad();
    } else {
      minimap.once('style.load', handleStyleLoad);
    }

    // Listen for relevant changes on the main map
    map.on('sourcedata', handleMainMapUpdate);
    map.on('styledata', handleMainMapUpdate);

    return () => {
      map.off('sourcedata', handleMainMapUpdate);
      map.off('styledata', handleMainMapUpdate);
      if (minimap) {
        previousLayersRef.current.forEach(layerId => {
          if (minimap.getLayer(layerId)) {
            minimap.removeLayer(layerId);
          }
          const sourceId = layerId.replace('layer', 'source');
          if (minimap.getSource(sourceId)) {
            minimap.removeSource(sourceId);
          }
        });
      }
    };
  }, [map, setupMinimapLayers]);

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
      
      // Calculate zoom level based on the larger span
      const maxSpan = Math.max(latSpan * (1 + padding), lngSpan * (1 + padding));
      const zoom = Math.min(Math.max(Math.log2(360 / maxSpan) - 1, 3), 9);

      setMinimapViewport({
        ...center,
        zoom,
        bearing: 0,
        pitch: 0
      });
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
          className={`bg-white/70 rounded-lg shadow-md hover:bg-gray-50/70 transition-colors w-12 h-12 flex items-center justify-center backdrop-blur-sm ${
            !polygon ? 'opacity-50 cursor-not-allowed' : ''
          }`}
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapAdditionalControls;