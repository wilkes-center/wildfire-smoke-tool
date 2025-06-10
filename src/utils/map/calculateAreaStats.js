import { TILESET_INFO } from './constants';
import { isPointInPolygon } from './geometryUtils';

const calculateAreaStats = async (map, polygon) => {
  if (!map || !polygon) {
    return [];
  }

  const stats = [];
  const processedLayers = new Set();

  console.log("Calculating area stats with tilesets:", TILESET_INFO);
  console.log("Map style loaded:", map.isStyleLoaded());
  console.log("Available sources:", Object.keys(map.getStyle()?.sources || {}));
  console.log("Available layers:", Object.keys(map.getStyle()?.layers || {}));

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

    console.log(`Found source and layer for ${tileset.id}`);

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
      console.log(`Processing hour ${hour} with formatted time: ${formattedTime}`);

      try {
        let features = [];

        // Method 1: Try queryRenderedFeatures first
        try {
          features = map.queryRenderedFeatures({
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

          console.log(`Method 1 (queryRenderedFeatures): Found ${features.length} features for hour ${hour} in tileset ${tileset.id}`);
        } catch (err) {
          console.warn(`Error with queryRenderedFeatures for ${layerId}:`, err);
        }

        // Method 2: If no features found, try querySourceFeatures
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

            console.log(`Method 2 (querySourceFeatures): Found ${features.length} features for hour ${hour} in tileset ${tileset.id}`);
          } catch (err) {
            console.warn(`Error with querySourceFeatures for ${sourceId}:`, err);
          }
        }

        if (features.length === 0) {
          console.log(`No features found for hour ${hour} in tileset ${tileset.id}`);
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
          console.log(`No valid PM2.5 values found for hour ${hour} in tileset ${tileset.id}`);
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
        
        console.log(`Added stats for hour ${hour}: avg=${Math.round(averagePM25 * 100) / 100}, max=${Math.round(maxPM25 * 100) / 100}, min=${Math.round(minPM25 * 100) / 100}`);
      } catch (error) {
        console.warn(`Error processing hour ${hour} for tileset ${tileset.id}:`, error);
        continue;
      }
    }

    if (tilesetStats.hourlyData.length > 0) {
      stats.push(tilesetStats);
      console.log(`Added tileset stats for ${tileset.id} with ${tilesetStats.hourlyData.length} hours of data`);
    } else {
      console.warn(`No data found for tileset ${tileset.id}`);
    }
  }

  console.log("Final area stats:", stats);
  return stats;
};

export default calculateAreaStats;