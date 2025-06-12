import _ from 'lodash';
import { useState, useCallback, useEffect } from 'react';

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
      return feature.geometry.coordinates[0].some(coord => isPointInPolygon(coord, polygon));
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

// Store event listener reference for proper cleanup
let layerPositionHandler = null;

// Alternative approach - insert above the topmost layer
const updateHighlightLayers = async (map, features, isDarkMode) => {
  const HIGHLIGHT_SOURCE = 'selected-tracts';
  const HIGHLIGHT_LAYER = 'selected-tracts-highlight';
  const OUTLINE_LAYER = 'selected-tracts-outline';

  try {
    // Clean up existing layers and event listeners
    if (layerPositionHandler) {
      map.off('sourcedata', layerPositionHandler);
      map.off('styledata', layerPositionHandler);
      layerPositionHandler = null;
    }

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

    // Add highlight fill layer
    map.addLayer({
      id: HIGHLIGHT_LAYER,
      type: 'fill',
      source: HIGHLIGHT_SOURCE,
      paint: {
        'fill-color': '#751d0c', // Mahogany color for both modes
        'fill-opacity': isDarkMode ? 0.5 : 0.3,
        'fill-outline-color': '#751d0c' // Mahogany for outline
      }
    });

    // Add outline layer
    map.addLayer({
      id: OUTLINE_LAYER,
      type: 'line',
      source: HIGHLIGHT_SOURCE,
      paint: {
        'line-color': '#751d0c', // Mahogany for outline
        'line-width': 1.5,
        'line-opacity': isDarkMode ? 0.9 : 0.7
      }
    });

    // Create the layer positioning function
    layerPositionHandler = () => {
      try {
        // First, move census highlight layers to top
        if (map.getLayer(HIGHLIGHT_LAYER)) {
          map.moveLayer(HIGHLIGHT_LAYER);
        }
        if (map.getLayer(OUTLINE_LAYER)) {
          map.moveLayer(OUTLINE_LAYER);
        }

        // Then, position polygon layers just below census layers but above PM2.5
        const polygonLayers = [
          'polygon-layer',
          'polygon-layer-outline',
          'polygon-layer-preview',
          'polygon-layer-vertices'
        ];
        polygonLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            // Position polygon layers before the census highlight layer
            map.moveLayer(layerId, HIGHLIGHT_LAYER);
          }
        });
      } catch (error) {
        console.warn('Error positioning layers:', error);
      }
    };

    // Position layers initially
    layerPositionHandler();

    // Add event listeners to maintain proper layer order
    map.on('sourcedata', layerPositionHandler);
    map.on('styledata', layerPositionHandler);
  } catch (error) {
    console.error('Error updating highlight layers:', error);
  }
};

const HIGHLIGHT_SOURCE = 'selected-tracts';
const HIGHLIGHT_LAYER = 'selected-tracts-highlight';
const OUTLINE_LAYER = 'selected-tracts-outline';

export const cleanupHighlightLayers = map => {
  if (!map) return;

  try {
    // Remove event listeners using stored reference
    if (layerPositionHandler) {
      map.off('sourcedata', layerPositionHandler);
      map.off('styledata', layerPositionHandler);
      layerPositionHandler = null;
    }

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
