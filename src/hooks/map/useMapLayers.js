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

  // Helper function to get relevant tilesets for a given date and hour
  const getRelevantTilesets = useCallback((date, hour, count = CHUNKS_TO_PRELOAD) => {
    const tilesets = new Set();
    let currentDate = new Date(date);
    let currentHour = hour;

    // Add current tileset
    const currentTileset = TILESET_INFO.find(tileset => 
      tileset.date === currentDate.toISOString().split('T')[0] && 
      currentHour >= tileset.startHour && 
      currentHour <= tileset.endHour
    );
    if (currentTileset) tilesets.add(currentTileset);

    // Add future tilesets
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

    // Add previous tileset for smooth transitions
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

        // Ensure current layer remains visible with correct filter
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

  // Cleanup old chunks that are no longer needed
  const cleanupOldChunks = useCallback((map, currentTilesetId) => {
    if (!map || !map.getStyle()) return;

    const chunksToKeep = new Set([currentTilesetId]);
    const { date, hour } = getCurrentDateTime();
    
    // Add IDs of chunks we want to keep
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

  // Initialize or reinitialize layers
  const initializeLayers = useCallback((map) => {
    if (!map || !map.getStyle()) return;

    try {
      // Clean up existing layers first
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

      // Reset tracking sets
      loadedLayersRef.current.clear();
      loadedSourcesRef.current.clear();
      preloadedChunksRef.current.clear();
      previousChunkRef.current = null;

      // Get current date and time
      const { date, hour } = getCurrentDateTime();
      
      // Initialize relevant tilesets
      const relevantTilesets = getRelevantTilesets(new Date(date), hour);
      
      relevantTilesets.forEach(tileset => {
        const sourceId = `source-${tileset.id}`;
        const layerId = `layer-${tileset.id}`;

        // Add source
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
                7, 25,
                8, 50,
                9, 90
              ],
              'circle-color': getPM25ColorInterpolation(isDarkMode),
              'circle-blur': 0.85,
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

  // Update layer visibility and filters
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

      // Preload or cleanup chunks as needed
      if (loadedLayersRef.current.size >= MAX_LOADED_CHUNKS) {
        cleanupOldChunks(map, currentTileset.id);
      }

      const relevantTilesets = getRelevantTilesets(new Date(date), hour);
      relevantTilesets.forEach(tileset => {
        const sourceId = `source-${tileset.id}`;
        const layerId = `layer-${tileset.id}`;

        // Add source and layer if they don't exist
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'vector',
            url: `mapbox://${tileset.id}`,
            maxzoom: 9
          });
          loadedSourcesRef.current.add(sourceId);
        }

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
                7, 25,
                8, 50,
                9, 90
              ],
              'circle-color': getPM25ColorInterpolation(isDarkMode),
              'circle-blur': 0.85,
              'circle-opacity': isDarkMode ? 0.6 : 0.4
            },
            layout: {
              'visibility': 'none'
            }
          });
          loadedLayersRef.current.add(layerId);
        }
      });

      // Update current layer visibility and filter
      const currentLayerId = `layer-${currentTileset.id}`;
      const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

      // Handle transition between chunks
      const isChunkTransition = previousChunkRef.current && 
                              previousChunkRef.current !== currentTileset.id &&
                              hour === currentTileset.startHour;

      if (isChunkTransition) {
        const prevLayerId = `layer-${previousChunkRef.current}`;
        const prevTimeString = `${date}T${String(hour - 1).padStart(2, '0')}:00:00`;

        if (map.getLayer(prevLayerId)) {
          map.setFilter(prevLayerId, [
            'all',
            ['==', ['get', 'time'], prevTimeString],
            ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
          ]);
          map.setLayoutProperty(prevLayerId, 'visibility', 'visible');

          // Hide previous layer after transition
          setTimeout(() => {
            if (map.getLayer(prevLayerId)) {
              map.setLayoutProperty(prevLayerId, 'visibility', 'none');
            }
          }, 100);
        }
      }

      // Update current layer
      if (map.getLayer(currentLayerId)) {
        map.setFilter(currentLayerId, [
          'all',
          ['==', ['get', 'time'], timeString],
          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
        ]);
        map.setLayoutProperty(currentLayerId, 'visibility', 'visible');
      }

      // Hide all other layers
      loadedLayersRef.current.forEach(layerId => {
        if (layerId !== currentLayerId && (!isChunkTransition || layerId !== `layer-${previousChunkRef.current}`)) {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });

      previousChunkRef.current = currentTileset.id;

      // Ensure colors are consistent with current theme
      updateLayerColors(map);

    } catch (error) {
      console.error('Error updating layers:', error);
    }
  }, [getCurrentDateTime, getRelevantTilesets, cleanupOldChunks, pm25Threshold, isDarkMode, updateLayerColors]);

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