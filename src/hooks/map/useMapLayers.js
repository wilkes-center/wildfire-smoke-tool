import { useCallback, useRef } from 'react';
import { TILESET_INFO, START_DATE, MAPBOX_TOKEN } from '../../utils/map/constants.js';

export const useMapLayers = (mapRef, pm25Threshold, currentHour, isMapLoaded) => {
  const loadedSourcesRef = useRef(new Set());
  const loadedLayersRef = useRef(new Set());
  const previousChunkRef = useRef(null);

  const getCurrentDateTime = useCallback(() => {
    const msPerHour = 60 * 60 * 1000;
    const currentDate = new Date(START_DATE.getTime() + (currentHour * msPerHour));
    const date = currentDate.toISOString().split('T')[0];
    const hour = currentDate.getUTCHours();

    const currentTileset = TILESET_INFO.find(tileset => 
        tileset.date === date && 
        hour >= tileset.startHour && 
        hour <= tileset.endHour
    );

    if (!currentTileset) {
        console.warn('No tileset found for:', { date, hour, currentHour });
        return { date: '', hour: 0 };
    }

    return { date, hour };
  }, [currentHour]);

  const preloadTileset = useCallback((map, tileset) => {
    const sourceId = `source-${tileset.id}`;
    const layerId = `layer-${tileset.id}`;

    if (!loadedSourcesRef.current.has(sourceId) && !map.getSource(sourceId)) {
      try {
        map.addSource(sourceId, {
          type: 'vector',
          url: `mapbox://${tileset.id}`
        });
        loadedSourcesRef.current.add(sourceId);
      } catch (sourceError) {
        console.error(`Error adding source ${sourceId}:`, sourceError);
      }
    }

    if (!loadedLayersRef.current.has(layerId) && !map.getLayer(layerId)) {
      try {
        map.addLayer({
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
            'circle-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['to-number', ['get', 'PM25'], 0], 0],
              0, '#00e400',
              12.1, '#ffff00',
              35.5, '#ff7e00',
              55.5, '#ff0000',
              150.5, '#8f3f97',
              250.5, '#7e0023'
            ],
            'circle-blur': 0.9,
            'circle-opacity': 0.4
          },
          layout: {
            'visibility': 'none'
          }
        });
        loadedLayersRef.current.add(layerId);
      } catch (layerError) {
        console.error(`Error adding layer ${layerId}:`, layerError);
      }
    }
  }, []);

  const getNextTileset = useCallback((currentDate, currentHour) => {
    const nextHour = currentHour + 1;
    const nextDate = new Date(currentDate);
    if (nextHour >= 24) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    return TILESET_INFO.find(tileset => 
      tileset.date === nextDate.toISOString().split('T')[0] && 
      (nextHour % 24) >= tileset.startHour && 
      (nextHour % 24) <= tileset.endHour
    );
  }, []);

  const updateLayers = useCallback((map) => {
    if (!map || !map.getStyle) return;

    try {
      const { date, hour } = getCurrentDateTime();
      
      // Get current and next tilesets
      const currentTileset = TILESET_INFO.find(tileset => 
        tileset.date === date && 
        hour >= tileset.startHour && 
        hour <= tileset.endHour
      );

      if (currentTileset) {
        // Preload current and next tilesets
        preloadTileset(map, currentTileset);
        const nextTileset = getNextTileset(new Date(date), hour);
        if (nextTileset) {
          preloadTileset(map, nextTileset);
        }

        const currentLayerId = `layer-${currentTileset.id}`;
        const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;

        // Handle chunk transition
        const isChunkTransition = previousChunkRef.current && 
                                previousChunkRef.current !== currentTileset.id &&
                                hour === currentTileset.startHour;

        if (isChunkTransition) {
          // Show both previous and current chunks during transition
          const prevLayerId = `layer-${previousChunkRef.current}`;
          const prevTimeString = `${date}T${String(hour - 1).padStart(2, '0')}:00:00`;

          // Update and show previous layer
          try {
            map.setFilter(prevLayerId, [
              'all',
              ['==', ['get', 'time'], prevTimeString],
              ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
            ]);
            map.setLayoutProperty(prevLayerId, 'visibility', 'visible');
          } catch (error) {
            console.error(`Error updating previous layer ${prevLayerId}:`, error);
          }

          // Hide previous layer after a short delay
          setTimeout(() => {
            if (map.getLayer(prevLayerId)) {
              map.setLayoutProperty(prevLayerId, 'visibility', 'none');
            }
          }, 100);
        }

        // Update current layer
        try {
          map.setFilter(currentLayerId, [
            'all',
            ['==', ['get', 'time'], timeString],
            ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
          ]);
          map.setLayoutProperty(currentLayerId, 'visibility', 'visible');
        } catch (error) {
          console.error(`Error updating current layer ${currentLayerId}:`, error);
        }

        // Hide other layers
        loadedLayersRef.current.forEach(id => {
          if (id !== currentLayerId && (!isChunkTransition || id !== `layer-${previousChunkRef.current}`)) {
            map.setLayoutProperty(id, 'visibility', 'none');
          }
        });

        // Update previous chunk reference
        previousChunkRef.current = currentTileset.id;
      }

    } catch (error) {
      console.error('Error updating layers:', error);
    }
  }, [pm25Threshold, getCurrentDateTime, preloadTileset, getNextTileset]);

  return { updateLayers };
};