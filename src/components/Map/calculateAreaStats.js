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

    for (let hour = 0; hour < 6; hour++) {
      const currentHour = tileset.startHour + hour;
      const formattedTime = `${tileset.date}T${String(currentHour).padStart(2, '0')}:00:00`;

      const features = map.queryRenderedFeatures({
        layers: [layerId],
        filter: [
          'all',
          ['==', ['get', 'time'], formattedTime],
          ['within', { type: 'Polygon', coordinates: [polygon] }]
        ]
      });

      if (features.length === 0) {
        console.warn(`No features found in selected area for tileset: ${tileset.id}, hour: ${currentHour}`);
        continue;
      }

      const aqiValues = features.map(feature => parseFloat(feature.properties.AQI) || 0);
      const averageAQI = aqiValues.reduce((sum, value) => sum + value, 0) / aqiValues.length;
      const maxAQI = Math.max(...aqiValues);
      const minAQI = Math.min(...aqiValues);

      tilesetStats.hourlyData.push({
        hour: currentHour,
        averageAQI: Math.round(averageAQI * 100) / 100,
        maxAQI: Math.round(maxAQI * 100) / 100,
        minAQI: Math.round(minAQI * 100) / 100,
        numPoints: features.length
      });
    }

    stats.push(tilesetStats);
  }

  return stats;
};

export default calculateAreaStats;