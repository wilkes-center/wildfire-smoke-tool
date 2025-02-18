import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map from 'react-map-gl';
import { Map as MapIcon } from 'lucide-react';
import { TILESET_INFO } from '../../../utils/map/constants.js';
import { getPM25ColorInterpolation } from '../../../utils/map/colors';
import ThemedPanel from './ThemedPanel';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [minimapViewport, setMinimapViewport] = useState(null);
  const minimapRef = useRef(null);
  const layersInitializedRef = useRef(false);

  useEffect(() => {
    if (!polygon) {
      layersInitializedRef.current = false;
    }
  }, [polygon]);

  // Handle polygon overlay
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !polygon) return;

    const sourceId = 'overview-polygon';
    const fillLayerId = 'overview-polygon-fill';
    const lineLayerId = 'overview-polygon-line';

    const addPolygonLayers = () => {
      // Clean up existing layers
      [fillLayerId, lineLayerId].forEach(id => {
        if (minimap.getLayer(id)) minimap.removeLayer(id);
      });
      if (minimap.getSource(sourceId)) minimap.removeSource(sourceId);

      // Add new polygon source and layers
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

      // Add fill layer
      minimap.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': isDarkMode ? '#60A5FA' : '#3B82F6',
          'fill-opacity': isDarkMode ? 0.3 : 0.2
        }
      });

      // Add outline layer
      minimap.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': isDarkMode ? '#60A5FA' : '#3B82F6',
          'line-width': 2
        }
      });
    };

    if (minimap.isStyleLoaded()) {
      addPolygonLayers();
    } else {
      minimap.once('style.load', addPolygonLayers);
    }

    return () => {
      if (minimap.getLayer(lineLayerId)) minimap.removeLayer(lineLayerId);
      if (minimap.getLayer(fillLayerId)) minimap.removeLayer(fillLayerId);
      if (minimap.getSource(sourceId)) minimap.removeSource(sourceId);
    };
  }, [polygon, isDarkMode]);

  // Update viewport when polygon changes
  useEffect(() => {
    if (!polygon || polygon.length === 0) {
      setIsExpanded(false);
      onExpandChange?.(false);
      return;
    }

    // Calculate bounds from polygon vertices
    const bounds = polygon.reduce(
      (acc, [lng, lat]) => ({
        minLng: Math.min(acc.minLng, lng),
        maxLng: Math.max(acc.maxLng, lng),
        minLat: Math.min(acc.minLat, lat),
        maxLat: Math.max(acc.maxLat, lat),
      }),
      { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
    );

    // Add padding to bounds
    const padding = 0.5;
    const latSpan = (bounds.maxLat - bounds.minLat) * (1 + padding);
    const lngSpan = (bounds.maxLng - bounds.minLng) * (1 + padding);

    // Calculate center and zoom
    const center = {
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      longitude: (bounds.minLng + bounds.maxLng) / 2
    };

    const latZoom = Math.log2(180 / latSpan) - 1;
    const lngZoom = Math.log2(360 / lngSpan) - 1;
    const zoom = Math.min(latZoom, lngZoom, 9);

    setMinimapViewport({
      ...center,
      zoom: Math.max(zoom, 3),
      bearing: 0,
      pitch: 0
    });

    setIsExpanded(true);
    onExpandChange?.(true);
  }, [polygon, onExpandChange]);

  const initializeLayers = useCallback((minimap) => {
    if (!minimap || !currentDateTime || layersInitializedRef.current) return;

    try {
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

      // Add new layers
      TILESET_INFO.forEach((tileset) => {
        const sourceId = `minimap-source-${tileset.id}`;
        const layerId = `minimap-layer-${tileset.id}`;

        minimap.addSource(sourceId, {
          type: 'vector',
          url: `mapbox://${tileset.id}`
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
              4, 2,
              5, 5,
              6, 10,
              7, 25,
              8, 50,
              9, 90
            ],
            'circle-color': getPM25ColorInterpolation(isDarkMode),
            'circle-blur': 0.85,
            'circle-opacity': 0
          },
          layout: {
            visibility: 'none'
          }
        });
      });

      layersInitializedRef.current = true;
      console.log('Minimap layers initialized');
    } catch (error) {
      console.error('Error initializing minimap layers:', error);
      layersInitializedRef.current = false;
    }
  }, [currentDateTime, isDarkMode]);

  const updateLayers = useCallback(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !currentDateTime || !layersInitializedRef.current) return;

    try {
      const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;

      // First set all layers to invisible
      TILESET_INFO.forEach((tileset) => {
        const layerId = `minimap-layer-${tileset.id}`;
        if (minimap.getLayer(layerId)) {
          minimap.setPaintProperty(layerId, 'circle-opacity', 0);
          minimap.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });

      // Find current tileset and update its layer
      const currentTileset = TILESET_INFO.find(tileset => 
        tileset.date === currentDateTime.date && 
        currentDateTime.hour >= tileset.startHour && 
        currentDateTime.hour <= tileset.endHour
      );

      if (currentTileset) {
        const currentLayerId = `minimap-layer-${currentTileset.id}`;
        
        if (minimap.getLayer(currentLayerId)) {
          minimap.setFilter(currentLayerId, [
            'all',
            ['==', ['get', 'time'], time],
            ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold || 0]
          ]);

          minimap.setPaintProperty(
            currentLayerId,
            'circle-opacity',
            isDarkMode ? 0.6 : 0.4
          );

          minimap.setLayoutProperty(
            currentLayerId,
            'visibility',
            'visible'
          );

          minimap.setPaintProperty(
            currentLayerId,
            'circle-color',
            getPM25ColorInterpolation(isDarkMode)
          );
        }
      }
    } catch (error) {
      console.error('Error updating minimap layers:', error);
    }
  }, [currentDateTime, pm25Threshold, isDarkMode]);

  // Handle map load
  const handleMinimapLoad = useCallback(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap) return;

    minimap.on('style.load', () => {
      layersInitializedRef.current = false;
      initializeLayers(minimap);
      updateLayers();
    });

    if (minimap.isStyleLoaded()) {
      initializeLayers(minimap);
      updateLayers();
    }
  }, [initializeLayers, updateLayers]);

  useEffect(() => {
    return () => {
      const minimap = minimapRef.current?.getMap();
      if (minimap) {
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
      }
      layersInitializedRef.current = false;
    };
  }, []);

  // Update layers when relevant props change
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (minimap && layersInitializedRef.current) {
      updateLayers();
    }
  }, [updateLayers, isDarkMode, currentDateTime, pm25Threshold]);

  const handleToggleExpand = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
    
    if (newState) {
      const minimap = minimapRef.current?.getMap();
      if (minimap && !layersInitializedRef.current) {
        initializeLayers(minimap);
        updateLayers();
      }
    }
  }, [isExpanded, onExpandChange, initializeLayers, updateLayers]);

  return (
    <div style={{ 
      position: 'fixed',
      top: isExpanded ? '10px' : '80px',
      right: '20px',
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out'
    }}>
      <ThemedPanel
        title="Area Overview"
        icon={MapIcon}
        isExpanded={isExpanded}
        onClose={handleToggleExpand}
        isDarkMode={isDarkMode}
        order={2}
      >
        <div className="w-full h-[360px] overflow-hidden rounded-lg relative">
          {minimapViewport && (
            <Map
              ref={minimapRef}
              initialViewState={minimapViewport}
              style={{ width: '100%', height: '100%' }}
              mapStyle={mapStyle}
              mapboxAccessToken={mapboxAccessToken}
              interactive={false}
              onLoad={handleMinimapLoad}
            />
          )}
        </div>
      </ThemedPanel>
    </div>
  );
};

export default MapAdditionalControls;