import { TILESET_INFO } from './constants';
import { isPointInPolygon } from './geometryUtils';

const calculateAreaStats = async (map, polygon) => {
  if (!map || !polygon) {
    return [];
  }

  const stats = [];
  const processedLayers = new Set();

  for (const tileset of TILESET_INFO) {
    const sourceId = `source-${tileset.id}`;
    const layerId = `layer-${tileset.id}`;

    if (processedLayers.has(layerId)) {
      continue;
    }
    let hasSource = false;
    let hasLayer = false;

    try {
      hasSource = map.getSource(sourceId);
      hasLayer = map.getLayer(layerId);
    } catch (error) {
      continue;
    }

    if (!hasSource || !hasLayer) {
      continue;
    }
    processedLayers.add(layerId);

    const tilesetStats = {
      tilesetId: tileset.id,
      date: tileset.date,
      startHour: tileset.startHour,
      hourlyData: []
    };

    for (let hour = tileset.startHour; hour <= tileset.endHour; hour++) {
      const formattedTime = `${tileset.date}T${String(hour).padStart(2, '0')}:00:00`;

      try {
        let features = [];
        try {
          features = map
            .queryRenderedFeatures({
              layers: [layerId],
              filter: ['all', ['==', ['get', 'time'], formattedTime]]
            })
            .filter(feature => {
              if (!feature.geometry || !feature.geometry.coordinates) {
                return false;
              }
              const coords = feature.geometry.coordinates;
              return isPointInPolygon(coords, polygon);
            });
        } catch (err) {
          // Ignore query errors - continue with next attempt
        }

        if (features.length === 0) {
          try {
            const sourceFeatures = map.querySourceFeatures(sourceId, {
              sourceLayer: tileset.layer,
              filter: ['==', ['get', 'time'], formattedTime]
            });

            features = sourceFeatures.filter(feature => {
              if (!feature.geometry || !feature.geometry.coordinates) {
                return false;
              }
              const coords = feature.geometry.coordinates;
              return isPointInPolygon(coords, polygon);
            });
          } catch (err) {
            // Ignore source query errors - continue with empty features
          }
        }

        if (features.length === 0) {
          continue;
        }

        const pm25Values = features
          .map(feature => {
            const pm25 = parseFloat(feature.properties.PM25);
            return isNaN(pm25) ? null : pm25;
          })
          .filter(value => value !== null);

        if (pm25Values.length === 0) {
          continue;
        }

        const averagePM25 = pm25Values.reduce((sum, value) => sum + value, 0) / pm25Values.length;
        const maxPM25 = Math.max(...pm25Values);
        const minPM25 = Math.min(...pm25Values);

        tilesetStats.hourlyData.push({
          hour,
          averagePM25: Math.round(averagePM25 * 100) / 100,
          maxPM25: Math.round(maxPM25 * 100) / 100,
          minPM25: Math.round(minPM25 * 100) / 100,
          numPoints: features.length
        });
      } catch (error) {
        continue;
      }
    }

    if (tilesetStats.hourlyData.length > 0) {
      stats.push(tilesetStats);
    }
  }

  return stats;
};

export default calculateAreaStats;
