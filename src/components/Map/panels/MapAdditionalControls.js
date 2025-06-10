import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map } from 'react-map-gl';
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
  onExpandChange,
  isPlaying,
  forceExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minimapViewport, setMinimapViewport] = useState(null);
  const minimapRef = useRef(null);
  const layersInitializedRef = useRef(false);
  const loadedSourcesRef = useRef(new Set());
  const loadedLayersRef = useRef(new Set());
  const previousChunkRef = useRef(null);

  const getCurrentDateTime = useCallback(() => {
    if (!currentDateTime) return { date: '', hour: 0 };
    return currentDateTime;
  }, [currentDateTime]);

  useEffect(() => {
    if (!polygon) {
      layersInitializedRef.current = false;
    }
  }, [polygon]);
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
          'fill-color': isDarkMode ? '#cea25d' : '#2d5954', // gold in dark mode, forest in light mode
          'fill-opacity': isDarkMode ? 0.3 : 0.2
        }
      });

      // Add outline layer
      minimap.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': isDarkMode ? '#cea25d' : '#2d5954', // gold in dark mode, forest in light mode
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
              7, 55,
              8, 70,
              9, 90
            ],
            'circle-color': getPM25ColorInterpolation(isDarkMode),
            'circle-blur': 0.6,
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

  const updateLayers = useCallback((map) => {
    if (!map || !map.getStyle()) return;

    try {
      const { date, hour } = getCurrentDateTime();
      
      // Find current tileset
      const currentTileset = TILESET_INFO.find(tileset => 
        tileset.date === date && 
        hour >= tileset.startHour && 
        hour <= tileset.endHour
      );

      if (!currentTileset) {
        console.warn('No tileset found for:', { date, hour });
        return;
      }

      // Calculate next hour for transition preparation
      const nextHour = (hour + 1) % 24;
      const nextDate = nextHour === 0 ? 
        new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
        date;

      // Find next tileset
      const nextTileset = TILESET_INFO.find(tileset =>
        tileset.date === nextDate &&
        nextHour >= tileset.startHour &&
        nextHour <= tileset.endHour
      );

      // Only keep current tileset and next tileset if we're at the very end of current tileset
      const relevantTilesetIds = new Set([currentTileset.id]);
      
      // Only add next tileset if we're at the exact transition point (last hour of current tileset)
      if (nextTileset && hour === currentTileset.endHour) {
        relevantTilesetIds.add(nextTileset.id);
      }

      // Clean up old layers that are no longer relevant
      const layersToRemove = [];
      loadedLayersRef.current.forEach(layerId => {
        const tilesetId = layerId.replace('minimap-layer-', '');
        if (!relevantTilesetIds.has(tilesetId)) {
          layersToRemove.push(layerId);
        }
      });

      // Remove old layers and sources
      layersToRemove.forEach(layerId => {
        const tilesetId = layerId.replace('minimap-layer-', '');
        const sourceId = `minimap-source-${tilesetId}`;
        
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
        
        loadedLayersRef.current.delete(layerId);
        loadedSourcesRef.current.delete(sourceId);
      });

      // Hide ALL layers first - be very aggressive about this
      TILESET_INFO.forEach((tileset) => {
        const layerId = `minimap-layer-${tileset.id}`;
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'circle-opacity', 0);
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });

      // Update current layer
      const currentLayerId = `minimap-layer-${currentTileset.id}`;
      const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

      // Ensure current layer exists
      if (!map.getLayer(currentLayerId)) {
        const currentSourceId = `minimap-source-${currentTileset.id}`;
        
        // Add source if it doesn't exist
        if (!map.getSource(currentSourceId)) {
          map.addSource(currentSourceId, {
            type: 'vector',
            url: `mapbox://${currentTileset.id}`,
            maxzoom: 9
          });
          loadedSourcesRef.current.add(currentSourceId);
        }

        // Add layer
        map.addLayer({
          id: currentLayerId,
          type: 'circle',
          source: currentSourceId,
          'source-layer': currentTileset.layer,
          maxzoom: 9,
          paint: {
            'circle-radius': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              4, 2,
              5, 5,
              6, 10,
              7, 55,
              8, 70,
              9, 90
            ],
            'circle-color': getPM25ColorInterpolation(isDarkMode),
            'circle-blur': 0.6,
            'circle-opacity': 0
          },
          layout: {
            visibility: 'none'
          }
        });
        loadedLayersRef.current.add(currentLayerId);
      }

      // Now show only the current layer
      if (map.getLayer(currentLayerId)) {
        map.setFilter(currentLayerId, [
          'all',
          ['==', ['get', 'time'], timeString],
          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], null], 0], pm25Threshold || 0]
        ]);
        
        map.setPaintProperty(
          currentLayerId,
          'circle-opacity',
          isDarkMode ? 0.6 : 0.5
        );
        map.setLayoutProperty(currentLayerId, 'visibility', 'visible');
      }

      // Only prepare next chunk if we're at the exact end of current chunk
      if (nextTileset && hour === currentTileset.endHour) {
        const nextSourceId = `minimap-source-${nextTileset.id}`;
        const nextLayerId = `minimap-layer-${nextTileset.id}`;

        // Add next chunk's source if it doesn't exist
        if (!map.getSource(nextSourceId)) {
          map.addSource(nextSourceId, {
            type: 'vector',
            url: `mapbox://${nextTileset.id}`,
            maxzoom: 9
          });
          loadedSourcesRef.current.add(nextSourceId);
        }

        // Add next chunk's layer if it doesn't exist
        if (!map.getLayer(nextLayerId)) {
          map.addLayer({
            id: nextLayerId,
            type: 'circle',
            source: nextSourceId,
            'source-layer': nextTileset.layer,
            maxzoom: 9,
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
              'circle-blur': 0.6,
              'circle-opacity': 0
            },
            layout: {
              'visibility': 'none'
            }
          });
          loadedLayersRef.current.add(nextLayerId);
        }

        // Prepare next chunk's data but keep it hidden
        const nextTimeString = `${nextDate}T${String(nextHour).padStart(2, '0')}:00:00`;
        map.setFilter(nextLayerId, [
          'all',
          ['==', ['get', 'time'], nextTimeString],
          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
        ]);
        
        // Keep next layer hidden - don't show it until we actually transition
        map.setPaintProperty(nextLayerId, 'circle-opacity', 0);
        map.setLayoutProperty(nextLayerId, 'visibility', 'none');
      }

      previousChunkRef.current = currentTileset.id;

    } catch (error) {
      console.error('Error updating minimap layers:', error);
    }
  }, [getCurrentDateTime, pm25Threshold, isDarkMode]);


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

  useEffect(() => {
    const minimap = minimapRef.current?.getMap();
    if (minimap && layersInitializedRef.current) {
      updateLayers(minimap);
    }
  }, [updateLayers, isDarkMode, currentDateTime, pm25Threshold]);

  const panelContent = (
    <div className="px-1">
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
    </div>
  );

  // If forceExpanded, render content directly without ThemedPanel wrapper
  if (forceExpanded) {
    return (
      <div className={`w-full rounded-xl shadow-xl overflow-hidden border-2 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-white' 
          : 'bg-white/95 border-mahogany'
      } backdrop-blur-md`}>
        <div className="w-full h-full flex flex-col">
          <div className={`px-4 py-3 border-b-2 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-forest-dark/30 to-sage-dark/30 border-white' 
              : 'bg-gradient-to-r from-cream to-sage-light/30 border-mahogany'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-semibold leading-none ${
                  isDarkMode ? 'text-white' : 'text-forest'
                }`}>
                  Area Overview
                </h2>
                <div className={`text-sm mt-1 ${
                  isDarkMode ? 'text-white/80' : 'text-forest-light'
                }`}>
                  {currentDateTime.date} {currentDateTime.hour.toString().padStart(2, '0')}:00
                </div>
              </div>
            </div>
          </div>
          
          <div className={`flex-1 overflow-hidden ${
            isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'
          }`}>
            {panelContent}
          </div>
        </div>
      </div>
    );
  }

  // Original ThemedPanel implementation for backward compatibility
  return (
    <div style={{ 
      position: 'fixed',
      top: isExpanded ? '450px' : '20px',
      right: '20px',
      width: isExpanded ? '480px' : '48px',
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out'
    }}>
      <ThemedPanel
        title="Area Overview"
        subtitle={`${currentDateTime.date} ${currentDateTime.hour.toString().padStart(2, '0')}:00`}
        icon={Map}
        isExpanded={isExpanded}
        onClose={handleToggleExpand}
        isDarkMode={isDarkMode}
        order={2}
      >
        {panelContent}
      </ThemedPanel>
    </div>
  );
};

export default MapAdditionalControls;
