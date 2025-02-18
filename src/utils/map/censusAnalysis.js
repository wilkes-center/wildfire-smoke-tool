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

const getBoundingBox = (polygon) => {
  const bounds = {
    minLng: Infinity,
    maxLng: -Infinity,
    minLat: Infinity,
    maxLat: -Infinity
  };

  polygon.forEach(([lng, lat]) => {
    bounds.minLng = Math.min(bounds.minLng, lng);
    bounds.maxLng = Math.max(bounds.maxLng, lng);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
  });

  // Add padding
  const lngPad = (bounds.maxLng - bounds.minLng) * 0.2;
  const latPad = (bounds.maxLat - bounds.minLat) * 0.2;

  return {
    minLng: bounds.minLng - lngPad,
    maxLng: bounds.maxLng + lngPad,
    minLat: bounds.minLat - latPad,
    maxLat: bounds.maxLat + latPad
  };
};

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

const arePolygonsEqual = (poly1, poly2) => {
  if (!poly1 || !poly2 || poly1.length !== poly2.length) return false;
  return poly1.every((coord, i) => 
    coord[0] === poly2[i][0] && coord[1] === poly2[i][1]
  );
};

const generateTractCacheKey = (polygon) => {
  if (!polygon) return null;
  return JSON.stringify(polygon);
};

const isCacheValid = (cache) => {
  if (!cache.data || !cache.timestamp) return false;
  const now = Date.now();
  return (now - cache.timestamp) < cache.TTL;
};

const updateHighlightLayers = async (map, features, isDarkMode) => {
  const HIGHLIGHT_SOURCE = 'selected-tracts';
  const HIGHLIGHT_LAYER = 'selected-tracts-highlight';
  const OUTLINE_LAYER = 'selected-tracts-outline';

  try {
    // Only recreate layers if they don't exist
    const shouldCreateLayers = !map.getSource(HIGHLIGHT_SOURCE);

    if (shouldCreateLayers) {
      [HIGHLIGHT_LAYER, OUTLINE_LAYER].forEach(layerId => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource(HIGHLIGHT_SOURCE)) map.removeSource(HIGHLIGHT_SOURCE);

      // Create source
      map.addSource(HIGHLIGHT_SOURCE, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
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

      // Add outline layer
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
    }

    // Update source data
    const geojson = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: { id: f.properties.GEOID }
      }))
    };

    map.getSource(HIGHLIGHT_SOURCE).setData(geojson);

  } catch (error) {
    console.error('Error updating highlight layers:', error);
  }
};

export const getSelectedCensusTracts = async (map, polygon, isDarkMode) => {
  if (!map || !polygon) {
    console.debug('Missing map or polygon');
    return { tracts: {}, summary: { totalPopulation: 0 } };
  }

  try {
    // Check cache based on polygon
    const cacheKey = generateTractCacheKey(polygon);
    if (cacheKey && 
        tractCalculationCache.key === cacheKey && 
        isCacheValid(tractCalculationCache)) {
      return tractCalculationCache.data;
    }

    if (selectedTractCache.polygon && 
        arePolygonsEqual(selectedTractCache.polygon, polygon)) {
      return selectedTractCache.tracts;
    }

    // Get the census tracts that intersect with our polygon
    const bounds = getBoundingBox(polygon);
    const sw = map.project([bounds.minLng, bounds.minLat]);
    const ne = map.project([bounds.maxLng, bounds.maxLat]);

    const features = map.queryRenderedFeatures([sw, ne], {
      layers: ['census-tracts-layer']
    }).filter(feature => {
      if (!feature.geometry || !feature.properties) return false;
      return feature.geometry.coordinates[0].some(coord => 
        isPointInPolygon(coord, polygon)
      );
    });

    if (features.length === 0) {
      console.debug('No census tracts found in selection');
      return { tracts: {}, summary: { totalPopulation: 0 } };
    }

    // Get valid GEOIDs from features
    const validGeoIds = features
      .map(f => f.properties.GEOID)
      .filter(geoid => geoid && isValidGEOID(geoid));

    if (validGeoIds.length === 0) {
      console.debug('No valid GEOIDs found in selected tracts');
      return { tracts: {}, summary: { totalPopulation: 0 } };
    }

    // Check/fetch census data
    if (!censusCache.data || !isCacheValid(censusCache)) {
      console.debug('Fetching new census data...');
      censusCache.data = await fetchCensusPopulation();
      censusCache.timestamp = Date.now();
    }

    // Process tract data
    const selectedTracts = {};
    let totalPopulation = 0;

    validGeoIds.forEach(geoid => {
      const tractData = censusCache.data[geoid];
      if (!tractData) {
        console.debug(`No population data found for tract ${geoid}`);
        return;
      }

      const feature = features.find(f => f.properties.GEOID === geoid);
      if (!feature) return;

      selectedTracts[geoid] = {
        population: tractData.population,
        metadata: {
          landArea: parseFloat(feature.properties.ALAND) || 0,
          geoid,
          state: tractData.metadata.state,
          county: tractData.metadata.county,
          tract: tractData.metadata.tract
        }
      };

      totalPopulation += tractData.population;
    });

    // Update visualization of selected tracts
    await updateHighlightLayers(map, features, isDarkMode);

    const result = {
      tracts: selectedTracts,
      summary: { 
        totalPopulation,
        tractCount: Object.keys(selectedTracts).length
      }
    };

    // Update caches
    if (cacheKey) {
      tractCalculationCache.key = cacheKey;
      tractCalculationCache.data = result;
      tractCalculationCache.timestamp = Date.now();
    }

    selectedTractCache = {
      polygon: [...polygon],
      tracts: result,
      bounds
    };

    return result;

  } catch (error) {
    console.error('Error in getSelectedCensusTracts:', error);
    return { tracts: {}, summary: { totalPopulation: 0 } };
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

export const cleanupHighlightLayers = (map) => {
  if (!map) return;

  const HIGHLIGHT_SOURCE = 'selected-tracts';
  const HIGHLIGHT_LAYER = 'selected-tracts-highlight';
  const OUTLINE_LAYER = 'selected-tracts-outline';

  try {
    [HIGHLIGHT_LAYER, OUTLINE_LAYER].forEach(layerId => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    });
    if (map.getSource(HIGHLIGHT_SOURCE)) map.removeSource(HIGHLIGHT_SOURCE);
  } catch (error) {
    console.error('Error cleaning up highlight layers:', error);
  }
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