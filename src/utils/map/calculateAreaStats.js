import { TILESET_INFO } from './constants';

const calculateAreaStats = async (map, polygon) => {
  if (!map || !polygon) {
    return [];
  }

  const stats = [];
  const processedLayers = new Set();

  for (const tileset of TILESET_INFO) {
    const sourceId = `source-${tileset.id}`;
    const layerId = `layer-${tileset.id}`;

    // Skip if we've already processed this layer
    if (processedLayers.has(layerId)) {
      continue;
    }

    // Check if source and layer exist
    let hasSource = false;
    let hasLayer = false;

    try {
      hasSource = map.getSource(sourceId);
      hasLayer = map.getLayer(layerId);
    } catch (error) {
      console.debug(`Source/layer check failed for ${tileset.id}:`, error);
      continue;
    }

    if (!hasSource || !hasLayer) {
      console.debug(`Source or layer not found for tileset: ${tileset.id}`);
      continue;
    }

    // Mark layer as processed
    processedLayers.add(layerId);

    const tilesetStats = {
      tilesetId: tileset.id,
      date: tileset.date,
      startHour: tileset.startHour,
      hourlyData: []
    };

    // Process each hour in the chunk
    for (let hour = tileset.startHour; hour <= tileset.endHour; hour++) {
      const formattedTime = `${tileset.date}T${String(hour).padStart(2, '0')}:00:00`;

      try {
        // Query features within the polygon for this specific hour
        const features = map.queryRenderedFeatures({
          layers: [layerId],
          filter: [
            'all',
            ['==', ['get', 'time'], formattedTime]
          ]
        }).filter(feature => {
          // Additional filtering for polygon intersection
          if (!feature.geometry || !feature.geometry.coordinates) {
            return false;
          }
          const coords = feature.geometry.coordinates;
          return isPointInPolygon(coords, polygon);
        });

        if (features.length === 0) {
          continue;
        }

        // Calculate statistics for this hour
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
        console.warn(`Error processing hour ${hour} for tileset ${tileset.id}:`, error);
        continue;
      }
    }

    if (tilesetStats.hourlyData.length > 0) {
      stats.push(tilesetStats);
    }
  }

  return stats;
};

// Helper function to check if a point is within a polygon
const isPointInPolygon = (point, polygon) => {
  if (!Array.isArray(point) || point.length < 2) {
    return false;
  }

  const x = point[0], y = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
};

export default calculateAreaStats;