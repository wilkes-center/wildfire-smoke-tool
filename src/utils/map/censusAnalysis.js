import { useState, useCallback, useEffect } from 'react';
import _ from 'lodash';
import { fetchCensusPopulation, isValidGEOID } from './census-api';

// Global cache for census data with TTL
const censusCache = {
  data: null,
  timestamp: null,
  TTL: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

// Cache for selected tract calculations
const tractCalculationCache = {
  key: null,
  data: null,
  timestamp: null,
  TTL: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Selected tracts cache
let selectedTractCache = {
  polygon: null,
  tracts: null,
  bounds: null
};

const dataCache = {
  features: new Map(),
  lastRequest: null,
  lastPolygon: null,
  lastResult: null,
  initialized: false
};

// Initialize cache with empty data to avoid first-time delay
const initializeCache = () => {
  if (dataCache.initialized) return;
  dataCache.initialized = true;
  dataCache.features = new Map();
};

// More efficient bounds calculation
const getBoundingBox = (polygon) => {
  return polygon.reduce((bounds, [lng, lat]) => ({
    minLng: Math.min(bounds.minLng, lng),
    maxLng: Math.max(bounds.maxLng, lng),
    minLat: Math.min(bounds.minLat, lat),
    maxLat: Math.max(bounds.maxLat, lat)
  }), {
    minLng: Infinity,
    maxLng: -Infinity,
    minLat: Infinity,
    maxLat: -Infinity
  });
};

// Optimized point-in-polygon check
const isPointInPolygon = (point, polygon) => {
  if (!Array.isArray(point) || point.length < 2) return false;
  
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

// Check if polygons are sufficiently similar to use cached results
const arePolygonsSimilar = (poly1, poly2, tolerance = 0.001) => {
  if (!poly1 || !poly2 || poly1.length !== poly2.length) return false;
  
  return poly1.every((coord, i) => 
    Math.abs(coord[0] - poly2[i][0]) < tolerance &&
    Math.abs(coord[1] - poly2[i][1]) < tolerance
  );
};

// Optimized feature querying
const queryFeaturesEfficiently = (map, bounds, layerId) => {
  const sw = map.project([bounds.minLng, bounds.minLat]);
  const ne = map.project([bounds.maxLng, bounds.maxLat]);
  
  return map.queryRenderedFeatures([sw, ne], {
    layers: [layerId]
  });
};

const highlightIntersectingTracts = async (map, polygon, isDarkMode) => {
  if (!map || !polygon) return null;

  try {
    // Calculate bounds
    const bounds = getBoundingBox(polygon);
    const features = queryFeaturesEfficiently(map, bounds, 'census-tracts-layer');

    if (!features || features.length === 0) return null;

    // Filter intersecting features
    const intersectingFeatures = features.filter(feature => {
      if (!feature.geometry || !feature.properties) return false;
      return feature.geometry.coordinates[0].some(coord => 
        isPointInPolygon(coord, polygon)
      );
    });

    if (intersectingFeatures.length === 0) return null;

    // Update highlight layers immediately
    await updateHighlightLayers(map, intersectingFeatures, isDarkMode);

    return {
      features: intersectingFeatures,
      tractCount: intersectingFeatures.length
    };
  } catch (error) {
    console.error('Error highlighting tracts:', error);
    return null;
  }
};

// Modified main selection function
export const getSelectedCensusTracts = async (map, polygon, isDarkMode) => {
  if (!map || !polygon) {
    return { 
      tracts: {}, 
      summary: { totalPopulation: 0, tractCount: 0 },
      status: 'error'
    };
  }

  try {
    // First, immediately highlight tracts and return initial count
    const highlightResult = await highlightIntersectingTracts(map, polygon, isDarkMode);
    
    if (!highlightResult) {
      return { 
        tracts: {}, 
        summary: { totalPopulation: 0, tractCount: 0 },
        status: 'noTracts'
      };
    }

    // Return initial result with tract count but no population yet
    const initialResult = {
      tracts: {},
      summary: { 
        totalPopulation: null, 
        tractCount: highlightResult.tractCount 
      },
      status: 'calculating'
    };

    // Trigger async population calculation
    const calculatePopulation = async () => {
      try {
        // Fetch census population data
        const censusPopulationData = await fetchCensusPopulation();
        
        // Process features with population data
        const selectedTracts = {};
        let totalPopulation = 0;

        highlightResult.features.forEach(feature => {
          const geoid = feature.properties.GEOID;
          if (!geoid || !isValidGEOID(geoid)) return;

          const censusData = censusPopulationData[geoid];
          const population = censusData ? censusData.population : 0;

          selectedTracts[geoid] = {
            population,
            metadata: {
              landArea: parseFloat(feature.properties.ALAND) || 0,
              geoid,
              state: censusData?.metadata?.state || feature.properties.STATEFP,
              county: censusData?.metadata?.county || feature.properties.COUNTYFP,
              tract: censusData?.metadata?.tract || feature.properties.TRACTCE
            }
          };

          totalPopulation += population;
        });

        return {
          tracts: selectedTracts,
          summary: {
            totalPopulation,
            tractCount: highlightResult.tractCount
          },
          status: 'complete'
        };
      } catch (error) {
        console.error('Error calculating population:', error);
        return {
          tracts: {},
          summary: {
            totalPopulation: 0,
            tractCount: highlightResult.tractCount
          },
          status: 'error'
        };
      }
    };

    // Return both the initial result and the promise for full calculation
    return {
      ...initialResult,
      populationPromise: calculatePopulation()
    };

  } catch (error) {
    console.error('Error in getSelectedCensusTracts:', error);
    return { 
      tracts: {}, 
      summary: { totalPopulation: 0, tractCount: 0 },
      status: 'error'
    };
  }
};

// In the updateHighlightLayers function in censusAnalysis.js:
const updateHighlightLayers = async (map, features, isDarkMode) => {
  const HIGHLIGHT_SOURCE = 'selected-tracts';
  const HIGHLIGHT_LAYER = 'selected-tracts-highlight';
  const OUTLINE_LAYER = 'selected-tracts-outline';

  try {
    const geojson = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: { id: f.properties.GEOID }
      }))
    };

    // First, remove any existing highlight layers to re-add them on top
    [HIGHLIGHT_LAYER, OUTLINE_LAYER].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource(HIGHLIGHT_SOURCE)) {
      map.removeSource(HIGHLIGHT_SOURCE);
    }

    // Add the source
    map.addSource(HIGHLIGHT_SOURCE, {
      type: 'geojson',
      data: geojson
    });

    // Add highlight fill layer
    map.addLayer({
      id: HIGHLIGHT_LAYER,
      type: 'fill',
      source: HIGHLIGHT_SOURCE,
      paint: {
        'fill-color': isDarkMode ? '#7C3AED' : '#8B5CF6',
        'fill-opacity': isDarkMode ? 0.4 : 0.3,
        'fill-outline-color': isDarkMode ? '#9F7AEA' : '#7C3AED'
      }
    });

    // Add outline layer at the very top
    map.addLayer({
      id: OUTLINE_LAYER,
      type: 'line',
      source: HIGHLIGHT_SOURCE,
      paint: {
        'line-color': isDarkMode ? '#A78BFA' : '#7C3AED',
        'line-width': 1.5,
        'line-opacity': isDarkMode ? 0.8 : 0.6
      }
    });

  } catch (error) {
    console.error('Error updating highlight layers:', error);
  }
};

// Cleanup function
export const cleanupHighlightLayers = (map) => {
  if (!map) return;

  const HIGHLIGHT_SOURCE = 'selected-tracts';
  const HIGHLIGHT_LAYER = 'selected-tracts-highlight';
  const OUTLINE_LAYER = 'selected-tracts-outline';

  try {
    [HIGHLIGHT_LAYER, OUTLINE_LAYER].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource(HIGHLIGHT_SOURCE)) {
      map.removeSource(HIGHLIGHT_SOURCE);
    }
  } catch (error) {
    console.error('Error cleaning up highlight layers:', error);
  }
};


export const usePopulationExposure = (map, polygon, isDarkMode, currentDateTime) => {
  const [stats, setStats] = useState({
    censusStats: {
      value: null,
      isLoading: true,
      error: null,
      tractCount: 0
    },
    exposureByPM25: {
      value: null,
      isLoading: true,
      error: null
    }
  });

  const updateExposure = useCallback(
    _.debounce(async () => {
      if (!map || !polygon || !currentDateTime) return;

      try {
        const censusData = await getSelectedCensusTracts(map, polygon, isDarkMode);
        setStats(prev => ({
          ...prev,
          censusStats: {
            value: censusData.summary,
            isLoading: false,
            error: null,
            tractCount: Object.keys(censusData.tracts).length
          }
        }));
      } catch (error) {
        console.error('Error updating population exposure:', error);
      }
    }, 500),
    [map, polygon, isDarkMode, currentDateTime]
  );

  useEffect(() => {
    updateExposure();
    return () => updateExposure.cancel();
  }, [updateExposure]);

  return stats;
};



export const clearCaches = () => {
  censusCache.data = null;
  censusCache.timestamp = null;
  
  tractCalculationCache.key = null;
  tractCalculationCache.data = null;
  tractCalculationCache.timestamp = null;
  
  selectedTractCache = {
    polygon: null,
    tracts: null,
    bounds: null
  };
};

export default getSelectedCensusTracts;