import { useCallback, useEffect, useRef } from 'react';
import { getPM25ColorInterpolation } from '../../utils/map/colorUtils';
import { TILESET_INFO } from '../../utils/map/tilesetInfo';
import { useLogger } from '../useLogger';

export const useMapLayers = (
  mapRef,
  pm25Threshold,
  currentHour,
  isMapLoaded,
  getDateTime,
  isDarkMode,
  reinitializeRef
) => {
  const { debug, warn, error, logAsync, startTimer } = useLogger('useMapLayers');
  const loadedSourcesRef = useRef(new Set());
  const loadedLayersRef = useRef(new Set());
  const previousChunkRef = useRef(null);
  const preloadedChunksRef = useRef(new Set());
  const CHUNKS_TO_PRELOAD = 4;
  const MAX_LOADED_CHUNKS = 12;

  const getRelevantTilesets = useCallback(() => {
    const timer = startTimer('getRelevantTilesets');

    if (!getDateTime) {
      warn('getDateTime function not available');
      timer.end();
      return [];
    }

    const { date, hour } = getDateTime(currentHour);
    const currentTilesetId = `${date}_${hour.toString().padStart(2, '0')}`;

    debug('Getting relevant tilesets', {
      currentHour,
      date,
      hour,
      currentTilesetId
    });

    const result = [];
    const currentTileset = TILESET_INFO.find(t => t.id === currentTilesetId);

    if (currentTileset) {
      result.push(currentTileset);
      debug('Added current tileset', { tilesetId: currentTileset.id });
    } else {
      warn('No tileset found for current time', {
        date,
        hour,
        currentTilesetId,
        availableTilesets: TILESET_INFO.map(t => t.id)
      });
    }

    // Add next hour tileset if available
    const nextHour = hour + 1;
    if (nextHour < 24) {
      const nextTilesetId = `${date}_${nextHour.toString().padStart(2, '0')}`;
      const nextTileset = TILESET_INFO.find(t => t.id === nextTilesetId);
      if (nextTileset) {
        result.push(nextTileset);
        debug('Added next tileset', { tilesetId: nextTileset.id });
      }
    }

    // Add previous hour tileset if available
    const prevHour = hour - 1;
    if (prevHour >= 0) {
      const prevTilesetId = `${date}_${prevHour.toString().padStart(2, '0')}`;
      const prevTileset = TILESET_INFO.find(t => t.id === prevTilesetId);
      if (prevTileset) {
        result.push(prevTileset);
        debug('Added previous tileset', { tilesetId: prevTileset.id });
      }
    }

    debug('Returning relevant tilesets', {
      count: result.length,
      tilesets: result.map(t => t.id)
    });

    timer.end();
    return result;
  }, [currentHour, getDateTime, debug, warn, startTimer]);

  const cleanupOldChunks = useCallback(() => {
    return logAsync('cleanupOldChunks', () => {
      const map = mapRef.current;
      if (!map) return;

      const relevantTilesets = getRelevantTilesets();
      const relevantIds = new Set(relevantTilesets.map(t => t.id));

      // Remove old layers
      loadedLayersRef.current.forEach(layerId => {
        const tilesetId = layerId.replace('layer-chunk-', '');
        if (!relevantIds.has(tilesetId)) {
          try {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
              loadedLayersRef.current.delete(layerId);
            }
          } catch (error) {
            error('Error removing layer', { layerId, error: error.message });
          }
        }
      });

      // Remove old sources
      loadedSourcesRef.current.forEach(sourceId => {
        const tilesetId = sourceId.replace('source-chunk-', '');
        if (!relevantIds.has(tilesetId)) {
          try {
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId);
              loadedSourcesRef.current.delete(sourceId);
            }
          } catch (error) {
            error('Error removing source', { sourceId, error: error.message });
          }
        }
      });
    });
  }, [mapRef, getRelevantTilesets, logAsync, error]);

  const updateLayerColors = useCallback(() => {
    return logAsync('updateLayerColors', () => {
      const map = mapRef.current;
      if (!map) return;

      const colorExpression = getPM25ColorInterpolation(pm25Threshold);

      loadedLayersRef.current.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'fill-color', colorExpression);

            // Update visibility based on current time
            const { date, hour } = getDateTime(currentHour);
            const currentLayerId = `layer-chunk-${date}_${hour.toString().padStart(2, '0')}`;

            if (layerId === currentLayerId) {
              map.setLayoutProperty(layerId, 'visibility', 'visible');
              debug('Made layer visible', { layerId });
            } else {
              map.setLayoutProperty(layerId, 'visibility', 'none');
            }
          }
        } catch (err) {
          error('Error updating layer colors', { layerId, error: err.message });
        }
      });

      // Set opacity for current layer
      const { date, hour } = getDateTime(currentHour);
      const currentLayerId = `layer-chunk-${date}_${hour.toString().padStart(2, '0')}`;

      if (map.getLayer(currentLayerId)) {
        const opacity = isDarkMode ? 0.9 : 0.75;
        map.setPaintProperty(currentLayerId, 'fill-opacity', opacity);
        debug('Updated layer opacity', {
          layerId: currentLayerId,
          opacity,
          isDarkMode
        });
      }
    });
  }, [mapRef, pm25Threshold, currentHour, getDateTime, isDarkMode, logAsync, debug, error]);

  const initializeLayers = useCallback(() => {
    return logAsync('initializeLayers', () => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      const relevantTilesets = getRelevantTilesets();
      debug('Initializing relevant tilesets', {
        count: relevantTilesets.length,
        tilesets: relevantTilesets.map(t => t.id)
      });

      relevantTilesets.forEach(tileset => {
        const sourceId = `source-chunk-${tileset.id}`;
        const layerId = `layer-chunk-${tileset.id}`;

        // Add source if not already added
        if (!map.getSource(sourceId)) {
          debug('Adding source', {
            sourceId,
            tilesetId: tileset.id,
            url: `mapbox://${tileset.id}`
          });

          map.addSource(sourceId, {
            type: 'vector',
            url: `mapbox://${tileset.id}`
          });
          loadedSourcesRef.current.add(sourceId);
        }

        // Add layer if not already added
        if (!map.getLayer(layerId)) {
          debug('Adding layer', {
            layerId,
            sourceId,
            sourceLayer: tileset.layer
          });

          const colorExpression = getPM25ColorInterpolation(pm25Threshold);

          map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            'source-layer': tileset.layer,
            paint: {
              'fill-color': colorExpression,
              'fill-opacity': isDarkMode ? 0.9 : 0.75
            },
            layout: {
              visibility: 'none'
            }
          });
          loadedLayersRef.current.add(layerId);
        }
      });

      // Update layer visibility and colors
      updateLayerColors();
    });
  }, [mapRef, getRelevantTilesets, pm25Threshold, isDarkMode, updateLayerColors, logAsync, debug]);

  const updateLayers = useCallback(() => {
    return logAsync('updateLayers', () => {
      const map = mapRef.current;
      if (!map || !isMapLoaded) return;

      const { date, hour } = getDateTime(currentHour);
      debug('Updating layers for current time', { date, hour, currentHour });
      debug('Available tilesets', {
        count: TILESET_INFO.length,
        tilesets: TILESET_INFO.map(t => t.id)
      });

      const currentTileset = TILESET_INFO.find(t => {
        const tilesetId = `${date}_${hour.toString().padStart(2, '0')}`;
        return t.id === tilesetId;
      });

      if (!currentTileset) {
        warn('No tileset found for current time', { date, hour });
        return;
      }

      debug('Using tileset', {
        tilesetId: currentTileset.id,
        layer: currentTileset.layer
      });

      const currentLayerId = `layer-chunk-${currentTileset.id}`;
      const currentSourceId = `source-chunk-${currentTileset.id}`;

      // Hide all layers first
      loadedLayersRef.current.forEach(layerId => {
        if (map.getLayer(layerId)) {
          const timeString = layerId.replace('layer-chunk-', '');
          debug('Processing layer visibility', {
            layerId,
            timeString,
            isCurrentLayer: layerId === currentLayerId
          });

          if (layerId === currentLayerId) {
            debug('Setting filter for current layer', {
              layerId: currentLayerId,
              timeString,
              pm25Threshold
            });

            map.setLayoutProperty(layerId, 'visibility', 'visible');
          } else {
            map.setLayoutProperty(layerId, 'visibility', 'none');
            debug('Hidden layer', { layerId });
          }
        }
      });

      // Create layer if it doesn't exist
      if (!map.getLayer(currentLayerId)) {
        debug('Creating missing layer', { layerId: currentLayerId });

        // Add source if needed
        if (!map.getSource(currentSourceId)) {
          debug('Adding source', {
            sourceId: currentSourceId,
            tilesetId: currentTileset.id,
            url: `mapbox://${currentTileset.id}`
          });

          map.addSource(currentSourceId, {
            type: 'vector',
            url: `mapbox://${currentTileset.id}`
          });
          loadedSourcesRef.current.add(currentSourceId);
        }

        debug('Adding layer', {
          layerId: currentLayerId,
          sourceId: currentSourceId,
          sourceLayer: currentTileset.layer
        });

        const colorExpression = getPM25ColorInterpolation(pm25Threshold);

        map.addLayer({
          id: currentLayerId,
          type: 'fill',
          source: currentSourceId,
          'source-layer': currentTileset.layer,
          paint: {
            'fill-color': colorExpression,
            'fill-opacity': isDarkMode ? 0.9 : 0.75
          },
          layout: {
            visibility: 'visible'
          }
        });
        loadedLayersRef.current.add(currentLayerId);
      } else {
        debug('Current layer exists', { layerId: currentLayerId });

        // Update existing layer
        map.setLayoutProperty(currentLayerId, 'visibility', 'visible');

        const opacity = isDarkMode ? 0.9 : 0.75;
        map.setPaintProperty(currentLayerId, 'fill-opacity', opacity);
        debug('Updated layer opacity', {
          layerId: currentLayerId,
          opacity
        });

        const colorExpression = getPM25ColorInterpolation(pm25Threshold);
        map.setPaintProperty(currentLayerId, 'fill-color', colorExpression);
        debug('Updated layer colors', {
          layerId: currentLayerId,
          pm25Threshold
        });
      }

      // Clean up old chunks
      cleanupOldChunks();
    });
  }, [
    mapRef,
    isMapLoaded,
    currentHour,
    getDateTime,
    pm25Threshold,
    isDarkMode,
    cleanupOldChunks,
    logAsync,
    debug,
    warn
  ]);

  // Effect for dark mode changes
  useEffect(() => {
    debug('Dark mode changed', { isDarkMode });
    if (isMapLoaded) {
      updateLayerColors();
    }
  }, [isDarkMode, isMapLoaded, updateLayerColors, debug]);

  // Effect for PM2.5 threshold changes
  useEffect(() => {
    debug('PM2.5 threshold changed', { pm25Threshold });
    if (isMapLoaded) {
      updateLayerColors();
    }
  }, [pm25Threshold, isMapLoaded, updateLayerColors, debug]);

  // Effect for current hour changes
  useEffect(() => {
    debug('Current hour changed', { currentHour });
    if (isMapLoaded) {
      updateLayers();
    }
  }, [currentHour, isMapLoaded, updateLayers, debug]);

  // Effect for style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleStyleData = () => {
      if (map.isStyleLoaded()) {
        debug('Map style loaded, reinitializing layers');
        initializeLayers();
      }
    };

    map.on('styledata', handleStyleData);
    return () => map.off('styledata', handleStyleData);
  }, [mapRef, initializeLayers, debug]);

  // Initial setup
  useEffect(() => {
    if (isMapLoaded && reinitializeRef?.current) {
      debug('Initial layer initialization');
      initializeLayers();
      reinitializeRef.current = false;
    }
  }, [isMapLoaded, initializeLayers, reinitializeRef, debug]);

  return {
    updateLayers,
    initializeLayers,
    cleanupOldChunks,
    updateLayerColors
  };
};

export default useMapLayers;
