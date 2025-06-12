import { useCallback, useEffect, useRef } from 'react';
import { getPM25ColorInterpolation } from '../../constants/pm25Levels';
import { TILESET_INFO } from '../../utils/map/constants';
import { useLogger } from '../useLogger';

export const useMapLayers = (
  mapInstance,
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

    debug('Getting relevant tilesets', {
      currentHour,
      date,
      hour
    });

    // Find the tileset that contains the current hour
    const currentTileset = TILESET_INFO.find(tileset => {
      const tilesetDate = tileset.date;
      const isCorrectDate = tilesetDate === date;
      const isInHourRange = hour >= tileset.startHour && hour <= tileset.endHour;

      debug('Checking tileset', {
        tilesetId: tileset.id,
        tilesetDate,
        startHour: tileset.startHour,
        endHour: tileset.endHour,
        currentHour: hour,
        isCorrectDate,
        isInHourRange
      });

      return isCorrectDate && isInHourRange;
    });

    const result = [];

    if (currentTileset) {
      result.push(currentTileset);
      debug('Found current tileset', {
        tilesetId: currentTileset.id,
        startHour: currentTileset.startHour,
        endHour: currentTileset.endHour
      });
    } else {
      warn('No tileset found for current time', {
        date,
        hour,
        availableTilesets: TILESET_INFO.map(t => ({
          id: t.id,
          date: t.date,
          startHour: t.startHour,
          endHour: t.endHour
        }))
      });
    }

    debug('Returning relevant tilesets', {
      count: result.length,
      tilesets: result.map(t => ({
        id: t.id,
        date: t.date,
        startHour: t.startHour,
        endHour: t.endHour
      }))
    });

    timer.end();
    return result;
  }, [currentHour, getDateTime, debug, warn, startTimer]);

  const cleanupOldChunks = useCallback(() => {
    return logAsync('cleanupOldChunks', () => {
      const map = mapInstance;
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
  }, [mapInstance, getRelevantTilesets, logAsync, error]);

  const updateLayerColors = useCallback(() => {
    return logAsync('updateLayerColors', () => {
      const map = mapInstance;
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
  }, [mapInstance, pm25Threshold, currentHour, getDateTime, isDarkMode, logAsync, debug, error]);

  const initializeLayers = useCallback(() => {
    return logAsync('initializeLayers', () => {
      const map = mapInstance;
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
  }, [mapInstance, getRelevantTilesets, pm25Threshold, isDarkMode, updateLayerColors, logAsync, debug]);

  const updateLayers = useCallback(() => {
    return logAsync('updateLayers', () => {
      const map = mapInstance;
      if (!map || !isMapLoaded) return;

      const { date, hour } = getDateTime(currentHour);
      debug('Updating layers for current time', { date, hour, currentHour });
      debug('Available tilesets', {
        count: TILESET_INFO.length,
        tilesets: TILESET_INFO.map(t => ({
          id: t.id,
          date: t.date,
          startHour: t.startHour,
          endHour: t.endHour
        }))
      });

      // Find the tileset that contains the current hour
      const currentTileset = TILESET_INFO.find(tileset => {
        const tilesetDate = tileset.date;
        const isCorrectDate = tilesetDate === date;
        const isInHourRange = hour >= tileset.startHour && hour <= tileset.endHour;
        return isCorrectDate && isInHourRange;
      });

      if (!currentTileset) {
        warn('No tileset found for current time', { date, hour });
        return;
      }

      debug('Using tileset', {
        tilesetId: currentTileset.id,
        layer: currentTileset.layer,
        startHour: currentTileset.startHour,
        endHour: currentTileset.endHour
      });

      const currentLayerId = `layer-chunk-${currentTileset.id}`;
      const currentSourceId = `source-chunk-${currentTileset.id}`;

      // Hide all layers first
      loadedLayersRef.current.forEach(layerId => {
        if (map.getLayer(layerId)) {
          debug('Processing layer visibility', {
            layerId,
            isCurrentLayer: layerId === currentLayerId
          });

          if (layerId === currentLayerId) {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            debug('Made layer visible', { layerId });
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
    mapInstance,
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
    const map = mapInstance;
    if (!map) return;

    const handleStyleData = () => {
      if (map.isStyleLoaded()) {
        debug('Map style loaded, reinitializing layers');
        initializeLayers();
      }
    };

    map.on('styledata', handleStyleData);
    return () => map.off('styledata', handleStyleData);
  }, [mapInstance, initializeLayers, debug]);

  // Initial setup
  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      debug('Initial layer initialization triggered', {
        mapInstance: !!mapInstance,
        isMapLoaded,
        reinitializeRef: reinitializeRef?.current
      });
      initializeLayers();
      if (reinitializeRef) {
        reinitializeRef.current = false;
      }
    }
  }, [mapInstance, isMapLoaded, initializeLayers, reinitializeRef, debug]);

  return {
    updateLayers,
    initializeLayers,
    cleanupOldChunks,
    updateLayerColors
  };
};

export default useMapLayers;
