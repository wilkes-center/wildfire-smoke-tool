import { TILESET_INFO } from './constants';

const calculateAreaStats = async (map, polygon) => {
  const stats = [];

  for (const tileset of TILESET_INFO) {
    const sourceId = `source-${tileset.id}`;
    const layerId = `layer-${tileset.id}`;

    if (!map.getSource(sourceId) || !map.getLayer(layerId)) {
      console.warn(`Source or layer not found for tileset: ${tileset.id}`);
      continue;
    }

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
        // Query features within the polygon for this specific hour without PM2.5 threshold
        const features = map.queryRenderedFeatures({
          layers: [layerId],
          filter: [
            'all',
            ['==', ['get', 'time'], formattedTime]
          ]
        }).filter(feature => {
          // Additional filtering for polygon intersection
          const coords = feature.geometry.coordinates;
          return isPointInPolygon(coords, polygon);
        });

        if (features.length === 0) {
          continue;
        }

        // Calculate statistics for this hour
        const pm25Values = features.map(feature => parseFloat(feature.properties.PM25) || 0);
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
        console.error(`Error processing hour ${hour} for tileset ${tileset.id}:`, error);
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