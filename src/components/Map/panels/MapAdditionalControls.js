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

    // Calculate center
    const center = {
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      longitude: (bounds.minLng + bounds.maxLng) / 2
    };

    // Calculate appropriate zoom level
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

  // Handle layer initialization and updates
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

      // Add new layers with dark mode colors
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
            'circle-opacity': isDarkMode ? 0.6 : 0.4
          },
          layout: {
            visibility: 'none'
          }
        });
      });

      layersInitializedRef.current = true;
    } catch (error) {
      console.error('Error initializing minimap layers:', error);
      layersInitializedRef.current = false;
    }
  }, [currentDateTime, isDarkMode]);

  // Update layer colors when dark mode changes
  const updateLayerColors = useCallback((minimap) => {
    if (!minimap) return;

    TILESET_INFO.forEach((tileset) => {
      const layerId = `minimap-layer-${tileset.id}`;
      if (minimap.getLayer(layerId)) {
        minimap.setPaintProperty(
          layerId,
          'circle-color',
          getPM25ColorInterpolation(isDarkMode)
        );
        minimap.setPaintProperty(
          layerId,
          'circle-opacity',
          isDarkMode ? 0.3 : 0.3
        );
      }
    });
  }, [isDarkMode]);

  const updateLayers = useCallback(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !currentDateTime || !layersInitializedRef.current) return;
  
    try {
      const time = `${currentDateTime.date}T${String(currentDateTime.hour).padStart(2, '0')}:00:00`;
  
      TILESET_INFO.forEach((tileset) => {
        const layerId = `minimap-layer-${tileset.id}`;
        if (!minimap.getLayer(layerId)) return;
  
        // Ensure all filter values are valid and non-undefined
        const filterExpression = [
          'all',
          ['==', ['get', 'time'], time],
          ['>=', 
            ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], 
            pm25Threshold || 0 // Provide default value if pm25Threshold is undefined
          ]
        ];
  
        // Set filter and layer visibility
        try {
          minimap.setFilter(layerId, filterExpression);
  
          const isCurrentTileset = (
            tileset.date === currentDateTime.date && 
            currentDateTime.hour >= tileset.startHour && 
            currentDateTime.hour <= tileset.endHour
          );
  
          minimap.setLayoutProperty(
            layerId,
            'visibility',
            isCurrentTileset ? 'visible' : 'none'
          );
        } catch (error) {
          console.error(`Error updating layer ${layerId}:`, error);
        }
      });
  
      // Update colors when layers are updated
      updateLayerColors(minimap);
    } catch (error) {
      console.error('Error updating minimap layers:', error);
    }
  }, [currentDateTime, pm25Threshold, updateLayerColors]);

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

  // Update layers when time, threshold, or dark mode changes
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (minimap && layersInitializedRef.current) {
      updateLayerColors(minimap);
      updateLayers();
    }
  }, [updateLayers, updateLayerColors, isDarkMode]);

  // Handle polygon overlay
  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (!minimap || !polygon) return;

    const sourceId = 'overview-polygon';
    const fillLayerId = 'overview-polygon-fill';
    const lineLayerId = 'overview-polygon-line';

    const addPolygonLayers = () => {
      [fillLayerId, lineLayerId].forEach(id => {
        if (minimap.getLayer(id)) minimap.removeLayer(id);
      });
      if (minimap.getSource(sourceId)) minimap.removeSource(sourceId);

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
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': isDarkMode ? '#60A5FA' : '#3B82F6',
          'fill-opacity': isDarkMode ? 0.3 : 0.2
        }
      });

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

  const handleToggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
    
    if (newState) {
      layersInitializedRef.current = false;
      const minimap = minimapRef.current?.getMap();
      if (minimap && minimap.isStyleLoaded()) {
        initializeLayers(minimap);
        updateLayers();
      }
    }
  };

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
      </ThemedPanel>
    </div>
  );
};

export default MapAdditionalControls;