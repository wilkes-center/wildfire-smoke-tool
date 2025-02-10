import _ from 'lodash';
import { fetchCensusPopulation } from './census-api';

 const HIGHLIGHT_LAYER_PREFIX = 'highlight-layer-';
 const BOUNDARY_LAYER_PREFIX = 'boundary-layer-';

// Configuration for census tract layers
export const getPopulationLayerConfig = () => ({
    source: {
      id: 'census-tracts',
      type: 'vector',
      url: 'mapbox://pkulandh.Utah_CT'
    },
    layers: [
      {
        id: 'census-tracts-layer',
        type: 'fill',
        source: 'census-tracts',
        'source-layer': 'Utah_CT_layer',
        paint: {
          'fill-color': '#6B7280',
          'fill-opacity': 0.1,
          'fill-outline-color': '#4B5563'
        }
      },
      {
        id: 'census-tracts-outline',
        type: 'line',
        source: 'census-tracts',
        'source-layer': 'Utah_CT_layer',
        paint: {
          'line-color': '#4B5563',
          'line-width': 1,
          'line-opacity': 0.3
        }
      }
    ]
  });
  
  const censusDataCache = new Map();
  let populationDataCache = null;
  
  export const getSelectedCensusTracts = async (map, polygon, isDarkMode) => {
    if (!map || !polygon) return { tracts: {}, summary: { totalPopulation: 0 }};
  
    try {
      // Generate a stable cache key for the polygon
      const cacheKey = JSON.stringify(polygon);
      
      // Check cache first
      if (censusDataCache.has(cacheKey)) {
        updateHighlightLayers(map, polygon, isDarkMode, censusDataCache.get(cacheKey));
        return censusDataCache.get(cacheKey);
      }
  
      // Verify the layer exists
      if (!map.getLayer('census-tracts-layer')) {
        console.error('Census tracts layer not found');
        return { tracts: {}, summary: { totalPopulation: 0 }};
      }
  
      // Calculate bounds once
      const bounds = getBounds(polygon);
      
      // Get features efficiently using bounds
      const features = map.queryRenderedFeatures({
        layers: ['census-tracts-layer'],
        filter: ['all']
      }).filter(feature => isFeatureInBounds(feature, bounds) && isFeatureInPolygon(feature, polygon));
  
      if (features.length === 0) {
        return { tracts: {}, summary: { totalPopulation: 0 }};
      }
  
      // Extract GEOIDs once
      const tractIds = [...new Set(features.map(f => f.properties.GEOID20))].filter(Boolean);
  
      // Fetch population data if not already cached
      if (!populationDataCache) {
        populationDataCache = await fetchCensusPopulation();
      }
  
      // Filter population data for selected tracts
      const selectedTracts = {};
      let totalPopulation = 0;
  
      tractIds.forEach(geoid => {
        if (populationDataCache[geoid]) {
          selectedTracts[geoid] = populationDataCache[geoid];
          totalPopulation += populationDataCache[geoid].population;
        }
      });
  
      const result = {
        tracts: selectedTracts,
        summary: { totalPopulation }
      };
  
      // Update cache
      censusDataCache.set(cacheKey, result);
  
      // Update highlight layers efficiently
      updateHighlightLayers(map, polygon, isDarkMode, result);
  
      return result;
  
    } catch (error) {
      console.error('Error in getSelectedCensusTracts:', error);
      return { tracts: {}, summary: { totalPopulation: 0 }};
    }
  };
  
  // Efficient bounds calculation
  const getBounds = (polygon) => {
    return polygon.reduce((bounds, coord) => ({
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
  };
  
  // Efficient feature filtering
  const isFeatureInBounds = (feature, bounds) => {
    const lon = parseFloat(feature.properties.INTPTLON20);
    const lat = parseFloat(feature.properties.INTPTLAT20);
    
    return !isNaN(lon) && !isNaN(lat) &&
           lon >= bounds.minLng && lon <= bounds.maxLng &&
           lat >= bounds.minLat && lat <= bounds.maxLat;
  };
  
  // Efficient polygon containment check
  const isFeatureInPolygon = (feature, polygon) => {
    const point = [
      parseFloat(feature.properties.INTPTLON20),
      parseFloat(feature.properties.INTPTLAT20)
    ];
    return isPointInPolygon(point, polygon);
  };
  
  // Optimized point-in-polygon check
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
  
  // Efficient layer updates with debouncing
  const updateHighlightLayers = _.debounce((map, polygon, isDarkMode, censusData) => {
    if (!map || !polygon) return;
  
    const polygonId = JSON.stringify(polygon);
    const highlightLayerId = `${HIGHLIGHT_LAYER_PREFIX}${polygonId}`;
    const boundaryLayerId = `${BOUNDARY_LAYER_PREFIX}${polygonId}`;
  
    try {
      // Remove existing layers if they exist
      [boundaryLayerId, highlightLayerId].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      if (map.getSource(highlightLayerId)) {
        map.removeSource(highlightLayerId);
      }
  
      // Create GeoJSON for the filtered features
      const geojson = {
        type: 'FeatureCollection',
        features: Object.keys(censusData.tracts).map(geoid => ({
          type: 'Feature',
          geometry: map.querySourceFeatures('census-tracts', {
            sourceLayer: 'Utah_CT_layer',
            filter: ['==', ['get', 'GEOID20'], geoid]
          })[0]?.geometry || null,
          properties: { GEOID20: geoid }
        })).filter(f => f.geometry)
      };
  
      // Add source and layers in a single operation
      map.addSource(highlightLayerId, { type: 'geojson', data: geojson });
  
      // Add highlight layers with optimized styling
      map.addLayer({
        id: highlightLayerId,
        type: 'fill',
        source: highlightLayerId,
        paint: {
          'fill-color': isDarkMode ? '#7C3AED' : '#8B5CF6',
          'fill-opacity': isDarkMode ? 0.4 : 0.3,
          'fill-outline-color': isDarkMode ? '#9F7AEA' : '#7C3AED'
        }
      });
  
      map.addLayer({
        id: boundaryLayerId,
        type: 'line',
        source: highlightLayerId,
        paint: {
          'line-color': isDarkMode ? '#A78BFA' : '#7C3AED',
          'line-width': 1.5,
          'line-opacity': isDarkMode ? 0.8 : 0.6
        }
      });
  
    } catch (error) {
      console.error('Error updating highlight layers:', error);
    }
  }, 100); // Debounce time of 100ms
  
  // Cleanup function
  export const cleanupHighlightLayers = (map, polygon) => {
    if (!map || !polygon) return;
    
    const polygonId = JSON.stringify(polygon);
    const highlightLayerId = `${HIGHLIGHT_LAYER_PREFIX}${polygonId}`;
    const boundaryLayerId = `${BOUNDARY_LAYER_PREFIX}${polygonId}`;
  
    [boundaryLayerId, highlightLayerId].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    if (map.getSource(highlightLayerId)) {
      map.removeSource(highlightLayerId);
    }
  
    // Clear cache when cleaning up
    censusDataCache.delete(polygonId);
  };
  
  export default getSelectedCensusTracts;