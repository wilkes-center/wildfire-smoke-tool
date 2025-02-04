import { useCallback } from 'react';
import { TILESET_INFO, START_DATE, MAPBOX_TOKEN } from '../../utils/map/constants.js';

export const useMapLayers = (mapRef, pm25Threshold, currentHour, isMapLoaded) => {
  const getCurrentDateTime = useCallback(() => {
    const msPerHour = 60 * 60 * 1000;
    const currentDate = new Date(START_DATE.getTime() + (currentHour * msPerHour));
    const date = currentDate.toISOString().split('T')[0];
    const hour = currentDate.getUTCHours();

    const currentTileset = TILESET_INFO.find(tileset => 
        tileset.date === date && 
        hour >= tileset.startHour && 
        hour < tileset.endHour
    );

    if (!currentTileset) {
        console.warn('No tileset found for:', { date, hour, currentHour });
        return { date: '', hour: 0 };
    }

    return { date, hour };
  }, [currentHour]);

  const updateLayers = useCallback((map) => {
    if (!map || !map.getStyle) return;

    try {
      // Add Census Tract Layer if it doesn't exist
      const censusSourceId = 'census-tracts-source';
      const censusLayerId = 'census-tracts-layer';

      if (!map.getSource(censusSourceId)) {
        map.addSource(censusSourceId, {
          type: 'vector',
          url: 'mapbox://pkulandh.Utah_CT'
        });
      }

      if (!map.getLayer(censusLayerId)) {
        map.addLayer({
          id: censusLayerId,
          type: 'line',
          source: censusSourceId,
          'source-layer': 'Utah_CT_layer',
          paint: {
            'line-color': '#6B7280',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4, 0.5,
              8, 1
            ],
            'line-opacity': 0,  // Set initial opacity to 0 to make tracts invisible
            'line-width': 0  // Set line width to 0 to ensure no lines are visible
          },
          layout: {
            'visibility': 'none'  // Change visibility to none
          }
        });
      }

      // Update AQI layers
      const { date, hour } = getCurrentDateTime();
      
      TILESET_INFO.forEach((tileset) => {
        const sourceId = `source-${tileset.id}`;
        const layerId = `layer-${tileset.id}`;

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'vector',
            tiles: [`https://api.mapbox.com/v4/${tileset.id}/{z}/{x}/{y}.vector.pbf?access_token=${MAPBOX_TOKEN}`],
            minzoom: 2,
            maxzoom: 8
          });
        }

        if (!map.getLayer(layerId)) {
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
                4, 15,
                5, 20,
                6, 25,
                7, 30,
                8, 50,
                9, 80,
                10, 100
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
              'circle-opacity': 0.15
            }
          }, 'census-tracts-layer'); 
        }

        const isActiveChunk = tileset.date === date && 
                            hour >= tileset.startHour && 
                            hour < tileset.endHour;

        if (isActiveChunk) {
          const timeString = `${date}T${String(hour).padStart(2, '0')}:00:00`;
          
          const filter = [
            'all',
            ['==', ['get', 'time'], timeString],
            ['>=', ['coalesce', ['to-number', ['get', 'PM25'], 0], 0], pm25Threshold]
          ];

          map.setFilter(layerId, filter);
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        } else {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });

    } catch (error) {
      console.error('Error updating layers:', error);
    }
  }, [pm25Threshold, getCurrentDateTime]);

  return { updateLayers };
};