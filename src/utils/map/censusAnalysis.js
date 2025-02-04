const getSelectedCensusTracts = async (map, polygon) => {
  if (!map || !polygon) return [];

  try {
      // First verify the layer exists
      if (!map.getLayer('census-tracts-layer')) {
          console.error('Census tracts layer not found');
          return { tracts: {}, summary: { totalPopulation: 0 }};
      }

      // Get all features without filtering
      const features = map.queryRenderedFeatures({
          layers: ['census-tracts-layer']
      });

      // Filter features within bounds
      const bounds = polygon.reduce((bounds, coord) => ({
          minLng: Math.min(bounds.minLng, coord[0]),
          maxLng: Math.max(bounds.maxLng, coord[0]),
          minLat: Math.min(bounds.minLat, coord[1]),
          maxLat: Math.max(bounds.maxLat, coord[1])
      }), {
          minLng: Infinity,
          maxLng: -Infinity,
          minLat: Infinity,
          maxLat: -Infinity
      });

      const filteredFeatures = features.filter(feature => {
          const lon = parseFloat(feature.properties.INTPTLON20);
          const lat = parseFloat(feature.properties.INTPTLAT20);
          
          return !isNaN(lon) && !isNaN(lat) &&
                 lon >= bounds.minLng && lon <= bounds.maxLng &&
                 lat >= bounds.minLat && lat <= bounds.maxLat;
      });

      // Create a stable ID for this polygon to avoid recreating the highlight layer
      const polygonId = polygon.map(coord => coord.join(',')).join('|');
      const highlightSourceId = `highlight-source-${polygonId}`;
      const highlightLayerId = `highlight-layer-${polygonId}`;

      // Only create highlight layers if they don't exist
      if (!map.getSource(highlightSourceId)) {
          // Create GeoJSON for the filtered features
          const geojson = {
              type: 'FeatureCollection',
              features: filteredFeatures.map(feature => ({
                  type: 'Feature',
                  geometry: feature.geometry,
                  properties: {
                      GEOID20: feature.properties.GEOID20
                  }
              }))
          };

          // Add source and layers for highlighting
          map.addSource(highlightSourceId, {
              type: 'geojson',
              data: geojson
          });

          // Add fill layer
          map.addLayer({
              id: highlightLayerId,
              type: 'fill',
              source: highlightSourceId,
              paint: {
                  'fill-color': '#8B5CF6',
                  'fill-opacity': 0.3,
                  'fill-outline-color': '#7C3AED'
              }
          });
      }

      // Extract GEOIDs
      const tractIds = [...new Set(filteredFeatures.map(f => f.properties.GEOID20))].filter(id => id);

      if (tractIds.length === 0) {
          console.log('No census tracts found in selection');
          return {
              tracts: {},
              summary: { totalPopulation: 0 }
          };
      }

      // Fetch only population data from Census API
      const baseUrl = 'https://api.census.gov/data/2020/acs/acs5';
      const url = `${baseUrl}?get=B01003_001E&for=tract:*&in=state:49&key=${process.env.REACT_APP_CENSUS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Process Census API response
      const [headers, ...rows] = data;
      const populationData = {};
      let totalPopulation = 0;

      rows.forEach(row => {
          const state = row[headers.indexOf('state')];
          const county = row[headers.indexOf('county')];
          const tract = row[headers.indexOf('tract')];
          const geoid = `${state}${county.padStart(3, '0')}${tract.padStart(6, '0')}`;
          
          if (tractIds.includes(geoid)) {
              const population = parseInt(row[headers.indexOf('B01003_001E')]) || 0;
              populationData[geoid] = { population };
              totalPopulation += population;
          }
      });

      return {
          tracts: populationData,
          summary: { totalPopulation }
      };

  } catch (error) {
      console.error('Error in getSelectedCensusTracts:', error);
      throw error;
  }
};

// Add cleanup function to be called when removing the polygon
export const cleanupHighlightLayers = (map, polygon) => {
  if (!map || !polygon) return;
  
  const polygonId = polygon.map(coord => coord.join(',')).join('|');
  const highlightSourceId = `highlight-source-${polygonId}`;
  const highlightLayerId = `highlight-layer-${polygonId}`;

  if (map.getLayer(highlightLayerId)) {
      map.removeLayer(highlightLayerId);
  }
  if (map.getSource(highlightSourceId)) {
      map.removeSource(highlightSourceId);
  }
};

export default getSelectedCensusTracts;