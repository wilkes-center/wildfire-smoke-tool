import { useCallback, useRef, useEffect } from 'react';
import { TILESET_INFO } from '../../utils/map/constants';
import { getPM25ColorInterpolation } from '../../utils/map/colors';

export const useMapLayers = (
  mapRef,
  pm25Threshold,
  currentHour,
  isMapLoaded,
  getCurrentDateTime,
  isDarkMode,
  needsLayerReinitRef
) => {
  const loadedSourcesRef = useRef(new Set());
  const loadedLayersRef = useRef(new Set());
  const previousChunkRef = useRef(null);
  const preloadedChunksRef = useRef(new Set());
  const CHUNKS_TO_PRELOAD = 4;
  const MAX_LOADED_CHUNKS = 12;

  
  const getRelevantTilesets = useCallback((date, hour, count = CHUNKS_TO_PRELOAD) => {
    const tilesets = new Set();
    let currentDate = new Date(date);
    let currentHour = hour;

    const currentTileset = TILESET_INFO.find(tileset => 
      tileset.date === currentDate.toISOString().split('T')[0] && 
      currentHour >= tileset.startHour && 
      currentHour <= tileset.endHour
    );
    if (currentTileset) tilesets.add(currentTileset);

    for (let i = 0; i < count; i++) {
      currentHour++;
      if (currentHour >= 24) {
        currentHour = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const nextTileset = TILESET_INFO.find(tileset => 
        tileset.date === currentDate.toISOString().split('T')[0] && 
        currentHour >= tileset.startHour && 
        currentHour <= tileset.endHour
      );

      if (nextTileset) tilesets.add(nextTileset);
    }

    currentDate = new Date(date);
    currentHour = hour - 1;
    if (currentHour < 0) {
      currentHour = 23;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    const prevTileset = TILESET_INFO.find(tileset =>  
      tileset.date === currentDate.toISOString().split('T')[0] && 
      currentHour >= tileset.startHour && 
      currentHour <= tileset.endHour
    );
    if (prevTileset) tilesets.add(prevTileset);

    return Array.from(tilesets);
  }, []);


  const cleanupOldChunks = useCallback((map, currentTilesetId) => {
    if (!map || !map.getStyle()) return;
  
    const chunksToKeep = new Set([currentTilesetId]);
    const { date, hour } = getCurrentDateTime();
    
    getRelevantTilesets(new Date(date), hour).forEach(tileset => 
      chunksToKeep.add(tileset.id)
    );
  
    // Remove old layers and sources
    loadedLayersRef.current.forEach(layerId => {
      const tilesetId = layerId.replace('layer-', '');
      if (!chunksToKeep.has(tilesetId)) {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          loadedLayersRef.current.delete(layerId);
          preloadedChunksRef.current.delete(tilesetId);
        } catch (error) {
          console.error(`Error removing layer ${layerId}:`, error);
        }
      }
    });
  
    loadedSourcesRef.current.forEach(sourceId => {
      const tilesetId = sourceId.replace('source-', '');
      if (!chunksToKeep.has(tilesetId)) {
        try {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
          loadedSourcesRef.current.delete(sourceId);
        } catch (error) {
          console.error(`Error removing source ${sourceId}:`, error);
        }
      }
    });
  }, [getCurrentDateTime, getRelevantTilesets]);

  const updateLayerColors = useCallback((map) => {
    if (!map || !map.getStyle()) return;

    const { date, hour } = getCurrentDateTime();
    const currentTileset = TILESET_INFO.find(tileset => 
      tileset.date === date && 
      hour >= tileset.startHour && 
      hour <= tileset.endHour
    );

    if (!currentTileset) return;

    const currentLayerId = `layer-${currentTileset.id}`;
    const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

    loadedLayersRef.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        // Update colors for all layers
        map.setPaintProperty(
          layerId,
          'circle-color',
          getPM25ColorInterpolation(isDarkMode)
        );
        map.setPaintProperty(
          layerId,
          'circle-opacity',
          isDarkMode ? 0.6 : 0.4
        );
        if (layerId === currentLayerId) {
          map.setFilter(layerId, [
            'all',
            ['==', ['get', 'time'], timeString],
            ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
          ]);
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      }
    });
  }, [isDarkMode, getCurrentDateTime, pm25Threshold]);

  

  const initializeLayers = useCallback((map) => {
    if (!map || !map.getStyle()) return;

    try {
      loadedLayersRef.current.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });

      loadedSourcesRef.current.forEach(sourceId => {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });

      loadedLayersRef.current.clear();
      loadedSourcesRef.current.clear();
      preloadedChunksRef.current.clear();
      previousChunkRef.current = null;

      const { date, hour } = getCurrentDateTime();
      
      const relevantTilesets = getRelevantTilesets(new Date(date), hour);
      
      relevantTilesets.forEach(tileset => {
        const sourceId = `source-${tileset.id}`;
        const layerId = `layer-${tileset.id}`;

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'vector',
            url: `mapbox://${tileset.id}`,
            maxzoom: 9
          });
          loadedSourcesRef.current.add(sourceId);
        }

        // Add layer
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            'source-layer': tileset.layer,
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
              'circle-blur': 0.9,
              'circle-opacity': isDarkMode ? 0.6 : 0.4
            },
            layout: {
              'visibility': 'none'
            }
          });
          loadedLayersRef.current.add(layerId);
          preloadedChunksRef.current.add(tileset.id);
        }
      });

      // Update colors for all layers
      updateLayerColors(map);

    } catch (error) {
      console.error('Error initializing layers:', error);
    }
  }, [getCurrentDateTime, getRelevantTilesets, isDarkMode, updateLayerColors]);

// Modified updateLayers function in useMapLayers.js

const updateLayers = useCallback((map) => {
  if (!map || !map.getStyle()) return;

  try {
    const { date, hour } = getCurrentDateTime();
    
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

    const nextTileset = TILESET_INFO.find(tileset =>
      tileset.date === nextDate &&
      nextHour >= tileset.startHour &&
      nextHour <= tileset.endHour
    );

    // Update current layer
    const currentLayerId = `layer-${currentTileset.id}`;
    const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

    // Set all layer opacities to 0 first
    loadedLayersRef.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'circle-opacity', 0);
      }
    });

    // Then set only the current layer to be visible
    if (map.getLayer(currentLayerId)) {
      map.setFilter(currentLayerId, [
        'all',
        ['==', ['get', 'time'], timeString],
        ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
      ]);
      
      map.setPaintProperty(currentLayerId, 'circle-opacity', isDarkMode ? 0.6 : 0.4);
      map.setLayoutProperty(currentLayerId, 'visibility', 'visible');
    }

    // Preload next chunk's data if we're near the end of current chunk
    if (nextTileset && hour === currentTileset.endHour) {
      const nextSourceId = `source-${nextTileset.id}`;
      const nextLayerId = `layer-${nextTileset.id}`;

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
            'circle-blur': 0.85,
            'circle-opacity': 0
          },
          layout: {
            'visibility': 'visible'
          }
        });
        loadedLayersRef.current.add(nextLayerId);
      }

      // Prepare next chunk's data
      const nextTimeString = `${nextDate}T${String(nextHour).padStart(2, '0')}:00:00`;
      map.setFilter(nextLayerId, [
        'all',
        ['==', ['get', 'time'], nextTimeString],
        ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
      ]);
    }

    // Clean up old layers that are no longer needed
    if (loadedLayersRef.current.size >= MAX_LOADED_CHUNKS) {
      cleanupOldChunks(map, currentTileset.id);
    }

    previousChunkRef.current = currentTileset.id;

  } catch (error) {
    console.error('Error updating layers:', error);
  }
}, [getCurrentDateTime, cleanupOldChunks, pm25Threshold, isDarkMode]);


  
  // Helper function to smoothly transition opacity
  const transitionOpacity = (map, layerId, targetOpacity, duration = 300) => {
    if (!map.getLayer(layerId)) return;
  
    const startOpacity = map.getPaintProperty(layerId, 'circle-opacity') || 0;
    const startTime = performance.now();
  
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smoother transition
      const eased = progress * (2 - progress);
      const currentOpacity = startOpacity + (targetOpacity - startOpacity) * eased;
  
      map.setPaintProperty(layerId, 'circle-opacity', currentOpacity);
  
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
  
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !isMapLoaded) return;

    // Force immediate update of colors and visibility
    updateLayerColors(map);
  }, [isDarkMode, isMapLoaded, updateLayerColors]);

  // Handle style changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handleStyleData = () => {
      if (needsLayerReinitRef.current) {
        console.log('Reinitializing layers after style change');
        initializeLayers(map);
        updateLayers(map);
        needsLayerReinitRef.current = false;
      }
    };

    map.on('styledata', handleStyleData);
    return () => map.off('styledata', handleStyleData);
  }, [initializeLayers, updateLayers]);

  // Handle initial layer setup and updates
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !isMapLoaded) return;

    updateLayers(map);
  }, [isMapLoaded, updateLayers, currentHour]);

  return { updateLayers, initializeLayers };
};

export default useMapLayers;