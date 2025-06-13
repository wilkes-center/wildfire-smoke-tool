import { useCallback, useEffect, useRef } from 'react';

import { getPM25ColorInterpolation } from '../../utils/map/colors';
import { TILESET_INFO } from '../../utils/map/constants';

import { useLogger } from '../useLogger';

/**
 * Enhanced useMapLayers hook with comprehensive logging
 * Manages map layers with error tracking and performance monitoring
 */
export const useMapLayers = (
  mapRef,
  pm25Threshold,
  currentHour,
  isMapLoaded,
  getCurrentDateTime,
  isDarkMode,
  needsLayerReinitRef
) => {
  // Initialize component-specific logger
  const { debug, warn, error, mapError, startTimer, logAsync, logStateChange, logUserInteraction } =
    useLogger('useMapLayers', {
      enablePerformanceTracking: true,
      context: { currentHour, pm25Threshold, isDarkMode }
    });

  const loadedSourcesRef = useRef(new Set());
  const loadedLayersRef = useRef(new Set());
  const previousChunkRef = useRef(null);
  const preloadedChunksRef = useRef(new Set());
  const CHUNKS_TO_PRELOAD = 4;
  const MAX_LOADED_CHUNKS = 12;

  // Get relevant tilesets with logging
  const getRelevantTilesets = useCallback(
    (date, hour, count = CHUNKS_TO_PRELOAD) => {
      const timer = startTimer('getRelevantTilesets');

      try {
        const tilesets = new Set();
        let currentDate = new Date(date);
        let currentHour = hour;

        debug('Getting relevant tilesets', {
          date: currentDate.toISOString().split('T')[0],
          hour: currentHour,
          count
        });

        const currentTileset = TILESET_INFO.find(
          tileset =>
            tileset.date === currentDate.toISOString().split('T')[0] &&
            currentHour >= tileset.startHour &&
            currentHour <= tileset.endHour
        );

        if (currentTileset) {
          tilesets.add(currentTileset);
          debug(`Added current tileset: ${currentTileset.id}`);
        } else {
          warn('No current tileset found', {
            date: currentDate.toISOString().split('T')[0],
            hour: currentHour,
            availableTilesets: TILESET_INFO.length
          });
        }

        // Add future tilesets
        for (let i = 0; i < count; i++) {
          currentHour++;
          if (currentHour >= 24) {
            currentHour = 0;
            currentDate.setDate(currentDate.getDate() + 1);
          }

          const nextTileset = TILESET_INFO.find(
            tileset =>
              tileset.date === currentDate.toISOString().split('T')[0] &&
              currentHour >= tileset.startHour &&
              currentHour <= tileset.endHour
          );

          if (nextTileset) {
            tilesets.add(nextTileset);
            debug(`Added next tileset: ${nextTileset.id}`);
          }
        }

        // Add previous tileset
        currentDate = new Date(date);
        currentHour = hour - 1;
        if (currentHour < 0) {
          currentHour = 23;
          currentDate.setDate(currentDate.getDate() - 1);
        }

        const prevTileset = TILESET_INFO.find(
          tileset =>
            tileset.date === currentDate.toISOString().split('T')[0] &&
            currentHour >= tileset.startHour &&
            currentHour <= tileset.endHour
        );

        if (prevTileset) {
          tilesets.add(prevTileset);
          debug(`Added previous tileset: ${prevTileset.id}`);
        }

        const result = Array.from(tilesets);
        const perfData = timer.end();

        debug('Relevant tilesets retrieved', {
          count: result.length,
          tilesets: result.map(t => t.id),
          performance: perfData
        });

        return result;
      } catch (getError) {
        timer.end();
        mapError('Failed to get relevant tilesets', {
          error: getError.message,
          stack: getError.stack,
          date,
          hour,
          count
        });
        return [];
      }
    },
    [debug, warn, mapError, startTimer]
  );

  // Cleanup old chunks with comprehensive error handling
  const cleanupOldChunks = useCallback(
    (map, currentTilesetId) => {
      return logAsync('cleanupOldChunks', async () => {
        if (!map || !map.getStyle()) {
          mapError('Cannot cleanup chunks - map not ready', {
            hasMap: !!map,
            hasStyle: !!map?.getStyle()
          });
          return;
        }

        const chunksToKeep = new Set([currentTilesetId]);
        const { date, hour } = getCurrentDateTime();

        getRelevantTilesets(new Date(date), hour).forEach(tileset => chunksToKeep.add(tileset.id));

        let layersRemoved = 0;
        let sourcesRemoved = 0;
        const cleanupErrors = [];

        // Remove old layers
        loadedLayersRef.current.forEach(layerId => {
          const tilesetId = layerId.replace('layer-', '');
          if (!chunksToKeep.has(tilesetId)) {
            try {
              if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
                layersRemoved++;
              }
              loadedLayersRef.current.delete(layerId);
              preloadedChunksRef.current.delete(tilesetId);
            } catch (cleanupError) {
              cleanupErrors.push({
                type: 'layer',
                id: layerId,
                error: cleanupError.message
              });
              error(`Error removing layer ${layerId}`, {
                layerId,
                error: cleanupError.message
              });
            }
          }
        });

        // Remove old sources
        loadedSourcesRef.current.forEach(sourceId => {
          const tilesetId = sourceId.replace('source-', '');
          if (!chunksToKeep.has(tilesetId)) {
            try {
              if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
                sourcesRemoved++;
              }
              loadedSourcesRef.current.delete(sourceId);
            } catch (cleanupError) {
              cleanupErrors.push({
                type: 'source',
                id: sourceId,
                error: cleanupError.message
              });
              error(`Error removing source ${sourceId}`, {
                sourceId,
                error: cleanupError.message
              });
            }
          }
        });

        debug('Cleanup completed', {
          layersRemoved,
          sourcesRemoved,
          remainingLayers: loadedLayersRef.current.size,
          remainingSources: loadedSourcesRef.current.size,
          errorCount: cleanupErrors.length
        });

        if (cleanupErrors.length > 0) {
          warn('Some cleanup operations failed', {
            errors: cleanupErrors.slice(0, 5) // Limit error details in logs
          });
        }
      });
    },
    [getCurrentDateTime, getRelevantTilesets, logAsync, debug, warn, error, mapError]
  );

  // Update layer colors with error handling
  const updateLayerColors = useCallback(
    map => {
      const timer = startTimer('updateLayerColors');

      try {
        if (!map || !map.getStyle()) {
          mapError('Cannot update layer colors - map not ready');
          return;
        }

        const dateTimeInfo = getCurrentDateTime();
        const { date, hour, tileset: tilesetId } = dateTimeInfo;

        const currentTileset = tilesetId
          ? TILESET_INFO.find(tileset => tileset.id === tilesetId)
          : TILESET_INFO.find(
              tileset =>
                tileset.date === date && hour >= tileset.startHour && hour <= tileset.endHour
            );

        if (!currentTileset) {
          warn('No matching tileset found for current time', { dateTimeInfo });
          return;
        }

        const currentLayerId = `layer-${currentTileset.id}`;
        const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

        let layersUpdated = 0;
        let layersHidden = 0;

        // Update all layers
        loadedLayersRef.current.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              // Update colors for all layers
              map.setPaintProperty(layerId, 'circle-color', getPM25ColorInterpolation(isDarkMode));

              // Hide all layers initially
              map.setLayoutProperty(layerId, 'visibility', 'none');
              layersHidden++;
            }
          } catch (layerUpdateError) {
            error(`Failed to update layer ${layerId}`, {
              layerId,
              error: layerUpdateError.message
            });
          }
        });

        // Show and configure current layer
        if (map.getLayer(currentLayerId)) {
          try {
            map.setFilter(currentLayerId, [
              'all',
              ['==', ['get', 'time'], timeString],
              ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
            ]);

            map.setLayoutProperty(currentLayerId, 'visibility', 'visible');
            map.setPaintProperty(currentLayerId, 'circle-opacity', isDarkMode ? 0.9 : 0.75);
            layersUpdated++;

            debug('Layer visibility updated', {
              currentLayerId,
              timeString,
              pm25Threshold,
              isDarkMode,
              opacity: isDarkMode ? 0.9 : 0.75
            });
          } catch (visibilityError) {
            mapError(`Failed to show current layer ${currentLayerId}`, {
              layerId: currentLayerId,
              error: visibilityError.message,
              timeString,
              pm25Threshold
            });
          }
        } else {
          warn('Current layer not found', {
            expectedLayerId: currentLayerId,
            availableLayers: Array.from(loadedLayersRef.current)
          });
        }

        const perfData = timer.end();
        debug('Layer colors update completed', {
          layersUpdated,
          layersHidden,
          currentLayer: currentLayerId,
          performance: perfData
        });
      } catch (colorUpdateError) {
        timer.end();
        mapError('Layer color update failed', {
          error: colorUpdateError.message,
          stack: colorUpdateError.stack
        });
      }
    },
    [getCurrentDateTime, pm25Threshold, isDarkMode, startTimer, debug, warn, mapError, error]
  );

  // Initialize layers with comprehensive error handling
  const initializeLayers = useCallback(
    map => {
      return logAsync('initializeLayers', async () => {
        debug('Starting layer initialization');

        if (!map || !map.getStyle()) {
          const error = new Error('Map or map style not available');
          mapError('Cannot initialize layers', {
            hasMap: !!map,
            hasStyle: !!map?.getStyle()
          });
          throw error;
        }

        try {
          // Clear existing layers and sources
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

          debug('Relevant tilesets for initialization', {
            count: relevantTilesets.length,
            tilesets: relevantTilesets.map(t => t.id)
          });

          let layersAdded = 0;
          let sourcesAdded = 0;
          const errors = [];

          for (const tileset of relevantTilesets) {
            const timer = startTimer(`addLayer_${tileset.id}`);

            try {
              const sourceId = `source-${tileset.id}`;
              const layerId = `layer-${tileset.id}`;

              // Add source
              if (!map.getSource(sourceId)) {
                debug(`Adding source: ${sourceId}`, { url: `mapbox://${tileset.id}` });
                map.addSource(sourceId, {
                  type: 'vector',
                  url: `mapbox://${tileset.id}`,
                  maxzoom: 9
                });
                loadedSourcesRef.current.add(sourceId);
                sourcesAdded++;
              }

              // Add layer
              if (!map.getLayer(layerId)) {
                debug(`Adding layer: ${layerId}`, { sourceLayer: tileset.layer });
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
                      4,
                      2,
                      5,
                      5,
                      6,
                      10,
                      7,
                      55,
                      8,
                      70,
                      9,
                      90
                    ],
                    'circle-color': getPM25ColorInterpolation(isDarkMode),
                    'circle-blur': 0.6,
                    'circle-opacity': 0
                  },
                  layout: {
                    visibility: 'none'
                  }
                });
                loadedLayersRef.current.add(layerId);
                preloadedChunksRef.current.add(tileset.id);
                layersAdded++;
              }

              timer.end();
            } catch (layerError) {
              timer.end();
              const errorData = {
                tilesetId: tileset.id,
                error: layerError.message,
                stack: layerError.stack
              };
              errors.push(errorData);
              mapError(`Failed to add layer for tileset ${tileset.id}`, errorData);
            }
          }

          // Update colors for all layers
          updateLayerColors(map);

          if (errors.length > 0) {
            warn('Some layers failed to initialize', {
              errorCount: errors.length,
              totalTilesets: relevantTilesets.length,
              errors: errors.slice(0, 3) // Limit error details in logs
            });
          }

          debug('Layer initialization completed', {
            layersAdded,
            sourcesAdded,
            totalLayers: loadedLayersRef.current.size,
            totalSources: loadedSourcesRef.current.size,
            errorCount: errors.length
          });

          return {
            layersAdded,
            sourcesAdded,
            errors: errors.length
          };
        } catch (initError) {
          mapError('Layer initialization failed', {
            error: initError.message,
            stack: initError.stack
          });
          throw initError;
        }
      });
    },
    [
      getCurrentDateTime,
      getRelevantTilesets,
      isDarkMode,
      updateLayerColors,
      logAsync,
      debug,
      warn,
      mapError,
      startTimer
    ]
  );

  // Update layers with comprehensive error handling
  const updateLayers = useCallback(
    map => {
      return logAsync('updateLayers', async () => {
        if (!map || !map.getStyle()) {
          mapError('Cannot update layers - map not ready', {
            hasMap: !!map,
            hasStyle: !!map?.getStyle()
          });
          return;
        }

        try {
          const dateTimeInfo = getCurrentDateTime();
          const { date, hour, tileset: tilesetId } = dateTimeInfo;

          debug('Current time info', dateTimeInfo);

          const currentTileset = tilesetId
            ? TILESET_INFO.find(tileset => tileset.id === tilesetId)
            : TILESET_INFO.find(
                tileset =>
                  tileset.date === date && hour >= tileset.startHour && hour <= tileset.endHour
              );

          if (!currentTileset) {
            warn('No tileset found for current time', { date, hour });
            return;
          }

          debug('Using tileset', { tileset: currentTileset });

          // Clean up old chunks first
          await cleanupOldChunks(map, currentTileset.id);

          const currentLayerId = `layer-${currentTileset.id}`;
          const currentSourceId = `source-${currentTileset.id}`;
          const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

          debug('Timeline data mapping', {
            currentHour,
            date,
            hour,
            tileset: currentTileset.id,
            timeString
          });

          // Hide all layers first
          loadedLayersRef.current.forEach(layerId => {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', 'none');
            }
          });

          // Check if the current layer exists, if not, create it
          if (!map.getLayer(currentLayerId)) {
            debug(`Creating missing layer: ${currentLayerId}`);

            // First check if the source exists, if not create it
            if (!map.getSource(currentSourceId)) {
              debug(`Adding source: ${currentSourceId}`, { url: `mapbox://${currentTileset.id}` });
              map.addSource(currentSourceId, {
                type: 'vector',
                url: `mapbox://${currentTileset.id}`,
                maxzoom: 9
              });
              loadedSourcesRef.current.add(currentSourceId);
            }

            // Add the layer
            debug(`Adding layer: ${currentLayerId}`, { sourceLayer: currentTileset.layer });
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
                  4,
                  2,
                  5,
                  5,
                  6,
                  10,
                  7,
                  55,
                  8,
                  70,
                  9,
                  90
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
            preloadedChunksRef.current.add(currentTileset.id);
          }

          // Update the current layer
          map.setLayoutProperty(currentLayerId, 'visibility', 'visible');
          map.setPaintProperty(currentLayerId, 'circle-opacity', isDarkMode ? 0.9 : 0.75);
          map.setFilter(currentLayerId, [
            'all',
            ['==', ['get', 'time'], timeString],
            ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
          ]);

          debug('Layer update completed', {
            currentLayerId,
            opacity: isDarkMode ? 0.9 : 0.75,
            pm25Threshold
          });
        } catch (updateError) {
          mapError('Layer update failed', {
            error: updateError.message,
            stack: updateError.stack,
            currentHour,
            pm25Threshold
          });
          throw updateError;
        }
      });
    },
    [
      getCurrentDateTime,
      cleanupOldChunks,
      isDarkMode,
      pm25Threshold,
      currentHour,
      logAsync,
      debug,
      warn,
      mapError
    ]
  );

  // Log state changes
  useEffect(() => {
    logStateChange('isDarkMode', undefined, isDarkMode, { currentHour });
  }, [isDarkMode, logStateChange, currentHour]);

  useEffect(() => {
    logStateChange('pm25Threshold', undefined, pm25Threshold, { currentHour });
  }, [pm25Threshold, logStateChange, currentHour]);

  useEffect(() => {
    logStateChange('currentHour', undefined, currentHour);
  }, [currentHour, logStateChange]);

  // Effect to handle style changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handleStyleData = () => {
      if (needsLayerReinitRef.current) {
        debug('Reinitializing layers after style change');

        logAsync('styleChangeReinit', async () => {
          await initializeLayers(map);
          await updateLayers(map);
          needsLayerReinitRef.current = false;
        }).catch(styleError => {
          mapError('Failed to reinitialize layers after style change', {
            error: styleError.message
          });
        });
      }
    };

    map.on('styledata', handleStyleData);
    return () => {
      map.off('styledata', handleStyleData);
      debug('Cleaned up style change handler');
    };
  }, [initializeLayers, updateLayers, debug, mapError, logAsync]);

  // Effect to handle initial layer setup and updates
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !isMapLoaded) return;

    debug('Map state changed', {
      hasMap: !!map,
      isMapLoaded,
      currentHour,
      loadedLayersCount: loadedLayersRef.current.size
    });

    logAsync('mapUpdate', async () => {
      // Initialize layers if needed
      if (!loadedLayersRef.current.size) {
        debug('Starting initial layer initialization');
        await initializeLayers(map);
      }

      // Update layers
      await updateLayers(map);
    }).catch(updateError => {
      mapError('Map update failed', {
        error: updateError.message,
        currentHour,
        isMapLoaded
      });
    });
  }, [isMapLoaded, currentHour, initializeLayers, updateLayers, debug, mapError, logAsync]);

  return {
    updateLayers,
    initializeLayers,
    cleanupOldChunks,
    updateLayerColors
  };
};

export default useMapLayers;
