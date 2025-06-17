import { useCallback, useEffect, useRef } from 'react';

import { getPM25ColorInterpolation } from '../../utils/map/colors';
import { TILESET_INFO } from '../../utils/map/constants';

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

    console.log(
      `Getting relevant tilesets for date: ${currentDate.toISOString().split('T')[0]}, hour: ${currentHour}`
    );

    const currentTileset = TILESET_INFO.find(
      tileset =>
        tileset.date === currentDate.toISOString().split('T')[0] &&
        currentHour >= tileset.startHour &&
        currentHour <= tileset.endHour
    );

    if (currentTileset) {
      tilesets.add(currentTileset);
      console.log(`Added current tileset: ${currentTileset.id}`);
    } else {
      console.warn(
        `No current tileset found for date: ${currentDate.toISOString().split('T')[0]}, hour: ${currentHour}`
      );
      console.log('Available tilesets:', TILESET_INFO);
    }

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
        console.log(`Added next tileset: ${nextTileset.id}`);
      }
    }

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
      console.log(`Added previous tileset: ${prevTileset.id}`);
    }

    const result = Array.from(tilesets);
    console.log(`Returning ${result.length} relevant tilesets:`, result);
    return result;
  }, []);

  const cleanupOldChunks = useCallback(
    (map, currentTilesetId) => {
      if (!map || !map.getStyle()) return;

      const chunksToKeep = new Set([currentTilesetId]);
      const { date, hour } = getCurrentDateTime();

      getRelevantTilesets(new Date(date), hour).forEach(tileset => chunksToKeep.add(tileset.id));

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
    },
    [getCurrentDateTime, getRelevantTilesets]
  );

  const updateLayerColors = useCallback(
    map => {
      if (!map || !map.getStyle()) return;

      // Get current date/time and possible tileset info
      const dateTimeInfo = getCurrentDateTime();
      const { date, hour, tileset: tilesetId } = dateTimeInfo;

      // Use the tileset ID if provided, otherwise search by date/hour
      const currentTileset = tilesetId
        ? TILESET_INFO.find(tileset => tileset.id === tilesetId)
        : TILESET_INFO.find(
            tileset => tileset.date === date && hour >= tileset.startHour && hour <= tileset.endHour
          );

      if (!currentTileset) return;

      const currentLayerId = `layer-${currentTileset.id}`;
      const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

      // First hide all layers and update colors
      loadedLayersRef.current.forEach(layerId => {
        if (map.getLayer(layerId)) {
          // Update colors for all layers
          map.setPaintProperty(layerId, 'circle-color', getPM25ColorInterpolation(isDarkMode));

          // Hide all layers initially
          map.setLayoutProperty(layerId, 'visibility', 'none');
          console.log(`Hidden layer: ${layerId}`);
        }
      });

      // Then only show the current layer
      if (map.getLayer(currentLayerId)) {
        // Set filter for current time and PM2.5 threshold
        map.setFilter(currentLayerId, [
          'all',
          ['==', ['get', 'time'], timeString],
          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
        ]);

        // Make current layer visible and set opacity
        map.setLayoutProperty(currentLayerId, 'visibility', 'visible');

        console.log(`Made layer ${currentLayerId} visible with zoom-based opacity`);
      }
    },
    [isDarkMode, getCurrentDateTime, pm25Threshold]
  );

  const initializeLayers = useCallback(
    map => {
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
        console.log('Initializing relevant tilesets:', relevantTilesets);

        relevantTilesets.forEach(tileset => {
          const sourceId = `source-${tileset.id}`;
          const layerId = `layer-${tileset.id}`;

          if (!map.getSource(sourceId)) {
            console.log(`Adding source: ${sourceId}, url: mapbox://${tileset.id}`);
            map.addSource(sourceId, {
              type: 'vector',
              url: `mapbox://${tileset.id}`,
              maxzoom: 9
            });
            loadedSourcesRef.current.add(sourceId);
          }

          // Add layer
          if (!map.getLayer(layerId)) {
            console.log(`Adding layer: ${layerId}, source-layer: ${tileset.layer}`);
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
                'circle-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  4,
                  isDarkMode ? 0.9 : 0.75,
                  6,
                  isDarkMode ? 0.5 : 0.4,
                  7,
                  isDarkMode ? 0.3 : 0.2,
                  8,
                  isDarkMode ? 0.2 : 0.15,
                  9,
                  isDarkMode ? 0.2 : 0.15
                ]
              },
              layout: {
                visibility: 'none'
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
    },
    [getCurrentDateTime, getRelevantTilesets, isDarkMode, updateLayerColors]
  );

  // Modified updateLayers function in useMapLayers.js

  const updateLayers = useCallback(
    map => {
      if (!map || !map.getStyle()) return;

      try {
        // Get current date/time and possible tileset info
        const dateTimeInfo = getCurrentDateTime();
        const { date, hour, tileset: tilesetId } = dateTimeInfo;

        console.log('Current date/hour:', { date, hour, tilesetId });
        console.log('Available tilesets:', TILESET_INFO);

        // Use the tileset ID if provided, otherwise search by date/hour
        const currentTileset = tilesetId
          ? TILESET_INFO.find(tileset => tileset.id === tilesetId)
          : TILESET_INFO.find(
              tileset =>
                tileset.date === date && hour >= tileset.startHour && hour <= tileset.endHour
            );

        if (!currentTileset) {
          console.warn('No tileset found for:', { date, hour });

          // Fallback: try to find the last available tileset instead of leaving map blank
          const lastTileset = TILESET_INFO[TILESET_INFO.length - 1];
          if (lastTileset) {
            console.log('Falling back to last available tileset:', lastTileset);

            // Use the last available tileset
            const fallbackLayerId = `layer-${lastTileset.id}`;
            const fallbackSourceId = `source-${lastTileset.id}`;

            // Hide all layers first
            loadedLayersRef.current.forEach(layerId => {
              if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', 'none');
              }
            });

            // Show the fallback layer if it exists
            if (map.getLayer(fallbackLayerId)) {
              // Use the last hour of the last tileset
              const fallbackHour = lastTileset.endHour;
              const fallbackTimeString = `${lastTileset.date}T${String(fallbackHour).padStart(2, '0')}:00:00`;

              map.setFilter(fallbackLayerId, [
                'all',
                ['==', ['get', 'time'], fallbackTimeString],
                ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
              ]);
              map.setLayoutProperty(fallbackLayerId, 'visibility', 'visible');

              console.log(`Showing fallback layer ${fallbackLayerId} with time ${fallbackTimeString}`);
            }
          }
          return;
        }

        console.log('Using tileset:', currentTileset);

        // Calculate next hour for transition preparation
        const nextHour = (hour + 1) % 24;
        const nextDate =
          nextHour === 0
            ? new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : date;

        const nextTileset = TILESET_INFO.find(
          tileset =>
            tileset.date === nextDate &&
            nextHour >= tileset.startHour &&
            nextHour <= tileset.endHour
        );

        // Update current layer
        const currentLayerId = `layer-${currentTileset.id}`;
        const currentSourceId = `source-${currentTileset.id}`;
        const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

        console.log(
          `Timeline data mapping: currentHour=${currentHour}, date=${date}, hour=${hour}, tileset=${currentTileset.id}`
        );
        console.log(`Looking for time ${timeString} in layer ${currentLayerId}`);

        console.log(`Setting filter for layer ${currentLayerId} with time ${timeString}`);

        // Hide all layers first
        loadedLayersRef.current.forEach(layerId => {
          if (map.getLayer(layerId)) {
            // Set to invisible instead of just opacity 0
            map.setLayoutProperty(layerId, 'visibility', 'none');
            console.log(`Hidden layer: ${layerId}`);
          }
        });

        // Check if the current layer exists, if not, create it
        if (!map.getLayer(currentLayerId)) {
          console.log(`Creating missing layer: ${currentLayerId}`);

          // First check if the source exists, if not create it
          if (!map.getSource(currentSourceId)) {
            console.log(`Adding source: ${currentSourceId}, url: mapbox://${currentTileset.id}`);
            map.addSource(currentSourceId, {
              type: 'vector',
              url: `mapbox://${currentTileset.id}`,
              maxzoom: 9
            });
            loadedSourcesRef.current.add(currentSourceId);
          }

          // Add the layer
          console.log(`Adding layer: ${currentLayerId}, source-layer: ${currentTileset.layer}`);
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
              'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                4,
                isDarkMode ? 0.9 : 0.75,
                6,
                isDarkMode ? 0.5 : 0.4,
                7,
                isDarkMode ? 0.3 : 0.2,
                8,
                isDarkMode ? 0.2 : 0.15,
                9,
                isDarkMode ? 0.2 : 0.15
              ]
            },
            layout: {
              visibility: 'none' // Start as hidden
            }
          });
          loadedLayersRef.current.add(currentLayerId);
          preloadedChunksRef.current.add(currentTileset.id);
        }

        // Now that we're sure the layer exists, update it
        console.log(`Current layer exists: ${currentLayerId}`);

        // Set visibility first
        map.setLayoutProperty(currentLayerId, 'visibility', 'visible');

        // Then set opacity
        // Remove the fixed opacity setting since we now use zoom-based opacity
        // map.setPaintProperty(currentLayerId, 'circle-opacity', isDarkMode ? 0.9 : 0.75);

        console.log(`Made layer ${currentLayerId} visible with zoom-based opacity`);

        // Finally set filter
        map.setFilter(currentLayerId, [
          'all',
          ['==', ['get', 'time'], timeString],
          ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
        ]);
        console.log(`Set filter for ${currentLayerId} with PM25 threshold: ${pm25Threshold}`);

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
                  4,
                  2,
                  5,
                  5,
                  6,
                  10,
                  7,
                  25,
                  8,
                  50,
                  9,
                  90
                ],
                'circle-color': getPM25ColorInterpolation(isDarkMode),
                'circle-blur': 0.6,
                'circle-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  4,
                  isDarkMode ? 0.9 : 0.75,
                  6,
                  isDarkMode ? 0.9 : 0.75,
                  7,
                  isDarkMode ? 0.4 : 0.3,
                  8,
                  isDarkMode ? 0.3 : 0.2,
                  9,
                  isDarkMode ? 0.3 : 0.2
                ]
              },
              layout: {
                visibility: 'none' // Start as hidden
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
    },
    [getCurrentDateTime, cleanupOldChunks, pm25Threshold, isDarkMode, getRelevantTilesets]
  );

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

    // First, initialize the layers
    if (!loadedLayersRef.current.size) {
      console.log('Initial layer initialization');
      initializeLayers(map);
    }

    // Then update them
    updateLayers(map);
  }, [isMapLoaded, updateLayers, initializeLayers, currentHour]);

  return { updateLayers, initializeLayers };
};

export default useMapLayers;
