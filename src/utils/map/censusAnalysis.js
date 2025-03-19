import { useState, useCallback, useEffect } from 'react';
import _ from 'lodash';
import { fetchCensusPopulation, isValidGEOID } from './census-api';
import { isPointInPolygon, getBoundingBox } from './geometryUtils';
import { removeLayerAndSource } from './layerUtils';

const censusCache = {
  data: null,
  timestamp: null,
  TTL: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

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

// Alternative approach - insert above the topmost layer
const updateHighlightLayers = async (map, features, isDarkMode) => {
  const HIGHLIGHT_SOURCE = 'selected-tracts';
  const HIGHLIGHT_LAYER = 'selected-tracts-highlight';
  const OUTLINE_LAYER = 'selected-tracts-outline';

  try {
    // Clean up existing layers
    [HIGHLIGHT_LAYER, OUTLINE_LAYER].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource(HIGHLIGHT_SOURCE)) {
      map.removeSource(HIGHLIGHT_SOURCE);
    }

    const geojson = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: { id: f.properties.GEOID }
      }))
    };

    // Add source
    map.addSource(HIGHLIGHT_SOURCE, {
      type: 'geojson',
      data: geojson
    });

    // Get the current layers to find the topmost one
    const layers = map.getStyle().layers;
    const topmostLayerId = layers[layers.length - 1].id;

    // Add highlight fill layer above the topmost layer
    map.addLayer({
      id: HIGHLIGHT_LAYER,
      type: 'fill',
      source: HIGHLIGHT_SOURCE,
      paint: {
        'fill-color': isDarkMode ? '#cea25d' : '#2d5954', // Using gold in dark mode, forest in light mode
        'fill-opacity': isDarkMode ? 0.4 : 0.3,
        'fill-outline-color': isDarkMode ? '#deb77d' : '#3a7370' // Light variants for outlines
      }
    }, topmostLayerId); // Insert above the topmost layer

    // Add outline layer at the very top
    map.addLayer({
      id: OUTLINE_LAYER,
      type: 'line',
      source: HIGHLIGHT_SOURCE,
      paint: {
        'line-color': isDarkMode ? '#deb77d' : '#3a7370', // Light variants for better visibility
        'line-width': 1.5,
        'line-opacity': isDarkMode ? 0.8 : 0.7
      }
    }); // This will be added at the top

  } catch (error) {
    console.error('Error updating highlight layers:', error);
  }
};

const HIGHLIGHT_SOURCE = 'selected-tracts';
const HIGHLIGHT_LAYER = 'selected-tracts-highlight';
const OUTLINE_LAYER = 'selected-tracts-outline';

export const cleanupHighlightLayers = (map) => {
  if (!map) return;

  try {
    // Clean up outline layer separately since it shares the source with highlight layer
    if (map.getLayer(OUTLINE_LAYER)) {
      map.removeLayer(OUTLINE_LAYER);
    }
    
    // Clean up the highlight layer and its source
    removeLayerAndSource(map, HIGHLIGHT_LAYER, HIGHLIGHT_SOURCE);
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