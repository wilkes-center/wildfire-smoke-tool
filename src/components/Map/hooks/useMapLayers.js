import { useCallback } from 'react';
import { TILESET_INFO, SKIPPED_HOURS, START_DATE } from '../constants';

export const useMapLayers = (mapRef, aqiThreshold, currentHour, isMapLoaded) => {
    const getCurrentDateTime = useCallback(() => {
        let adjustedHour = currentHour;
        if (adjustedHour >= 12) { 
          adjustedHour += SKIPPED_HOURS;
        }
        const currentDate = new Date(START_DATE.getTime() + adjustedHour * 60 * 60 * 1000);
        return {
          date: currentDate.toISOString().split('T')[0],
          hour: currentDate.getHours(),
        };
      }, [currentHour]);

      const updateLayers = useCallback((map) => {
        if (!map || !map.getStyle) return;
      
        try {
          const { date, hour } = getCurrentDateTime();
          const currentTime = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
      
          TILESET_INFO.forEach((tileset, index) => {
            const sourceId = `source-${tileset.id}`;
            const layerId = `layer-${tileset.id}`;
      
            if (!map.getSource(sourceId)) {
              map.addSource(sourceId, {
                type: 'vector',
                url: `mapbox://${tileset.id}`,
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
                      ['exponential', 3],
                      ['zoom'],
                      4, 25,
                      5, 30,
                      6, 35,
                      7, 40,
                      8, 45,
                    ],
                    'circle-color': [
                      'interpolate',
                      ['linear'],
                      ['to-number', ['get', 'AQI'], 0],
                      0, '#00e400',
                      51, '#ffff00',
                      101, '#ff7e00',
                      151, '#ff0000',
                      201, '#8f3f97',
                      301, '#7e0023',
                      500, '#7e0023'
                    ],
                    'circle-blur': 0.9,
                    'circle-opacity': 0.15, // Reduced from 0.3 to 0.15
                  },
                });
              }
      
            const layerStartTime = new Date(`${tileset.date}T${String(tileset.startHour).padStart(2, '0')}:00:00`);
            const layerEndTime = new Date(layerStartTime.getTime() + 6 * 60 * 60 * 1000);
            
            const extendedStartTime = new Date(layerStartTime.getTime() - 60 * 60 * 1000);
            const extendedEndTime = new Date(layerEndTime.getTime() + 60 * 60 * 1000);
      
            if (currentTime >= extendedStartTime && currentTime < extendedEndTime) {
              const currentHourInTileset = (currentTime.getTime() - layerStartTime.getTime()) / (60 * 60 * 1000);
              const formattedTime = `${tileset.date}T${String(tileset.startHour + Math.floor(currentHourInTileset)).padStart(2, '0')}:00:00`;
      
              const filter = [
                'all',
                ['==', ['get', 'time'], formattedTime],
                ['>=', ['to-number', ['get', 'AQI']], aqiThreshold]
              ];
      
              map.setFilter(layerId, filter);
      
    
              let opacity;
              if (currentTime < layerStartTime) {
                opacity = 1 - (layerStartTime - currentTime) / (60 * 60 * 1000);
              } else if (currentTime >= layerEndTime) {
                opacity = 1 - (currentTime - layerEndTime) / (60 * 60 * 1000);
              } else {
                opacity = 1;
              }
      
              opacity = Math.max(0, Math.min(1, opacity));
      
              // Multiply the calculated opacity by 0.15 to maintain relative transparency
              map.setPaintProperty(layerId, 'circle-opacity', opacity * 0.15);
              map.setLayoutProperty(layerId, 'visibility', 'visible');
            } else {
              map.setLayoutProperty(layerId, 'visibility', 'none');
            }
          });
      
        } catch (error) {
          console.error('Error updating layers:', error);
        }
      }, [aqiThreshold, getCurrentDateTime]);
    

  return { updateLayers };
};