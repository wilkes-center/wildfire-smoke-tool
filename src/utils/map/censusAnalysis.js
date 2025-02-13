import { useState, useCallback, useEffect } from 'react';
import _ from 'lodash';


// Cache for selected census tracts to avoid recalculation on pan/zoom
let selectedTractCache = {
  polygon: null,
  tracts: null,
  bounds: null
};

export const getSelectedCensusTracts = async (map, polygon, isDarkMode) => {
  if (!map || !polygon) {
    console.debug('Missing map or polygon');
    return { tracts: {}, summary: { totalPopulation: 0 } };
  }

  try {
    // Check if we already have results for this polygon
    if (selectedTractCache.polygon && 
        arePolygonsEqual(selectedTractCache.polygon, polygon)) {
      return selectedTractCache.tracts;
    }

    // Verify map is loaded
    if (!map.isStyleLoaded()) {
      console.debug('Map style not loaded');
      return { tracts: {}, summary: { totalPopulation: 0 } };
    }

    const CENSUS_LAYER = 'census-tracts-layer';
    const SOURCE_LAYER = 'cb_2019_us_tract_500k-2qnt3v';

    if (!map.getLayer(CENSUS_LAYER)) {
      console.debug('Census tracts layer not found:', CENSUS_LAYER);
      return { tracts: {}, summary: { totalPopulation: 0 } };
    }

    // Calculate bounds once and cache them
    const bounds = getBoundingBox(polygon);
    const sw = map.project([bounds.minLng, bounds.minLat]);
    const ne = map.project([bounds.maxLng, bounds.maxLat]);

    // Query features only once
    const features = map.queryRenderedFeatures([sw, ne], {
      layers: [CENSUS_LAYER]
    });

    // Filter intersecting features
    const selectedFeatures = features.filter(feature => {
      if (!feature.geometry || !feature.properties) return false;

      if (feature.geometry.type === 'Polygon') {
        return feature.geometry.coordinates[0].some(coord => 
          isPointInPolygon(coord, polygon)
        );
      }

      const center = feature.properties.INTPTLON20 && feature.properties.INTPTLAT20
        ? [parseFloat(feature.properties.INTPTLON20), parseFloat(feature.properties.INTPTLAT20)]
        : null;
        
      return center ? isPointInPolygon(center, polygon) : false;
    });

    if (selectedFeatures.length === 0) {
      console.debug('No features found in selection');
      return { tracts: {}, summary: { totalPopulation: 0 } };
    }

    // Process tract data
    const selectedTracts = {};
    let totalPopulation = 0;

    selectedFeatures.forEach(feature => {
      const props = feature.properties;
      if (!props || !props.GEOID) return;

      const geoid = props.GEOID;
      const landArea = parseFloat(props.ALAND) || 0;
      const estimatedPopulation = Math.round((landArea / 1000000) * 2500);

      selectedTracts[geoid] = {
        population: estimatedPopulation,
        metadata: {
          landArea,
          geoid
        }
      };

      totalPopulation += estimatedPopulation;
    });

    // Update highlight layers only if polygon has changed
    if (!selectedTractCache.polygon || 
        !arePolygonsEqual(selectedTractCache.polygon, polygon)) {
      await updateHighlightLayers(map, selectedFeatures, isDarkMode);
    }

    const result = {
      tracts: selectedTracts,
      summary: { totalPopulation }
    };

    // Cache the results
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


// Helper function to compare polygons
const arePolygonsEqual = (poly1, poly2) => {
  if (!poly1 || !poly2 || poly1.length !== poly2.length) return false;
  return poly1.every((coord, i) => 
    coord[0] === poly2[i][0] && coord[1] === poly2[i][1]
  );
};

// Modified updateHighlightLayers function to be more efficient
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

// Modified PopulationExposureCounter component
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

  

  // Debounced update function to prevent excessive calculations
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



export default getSelectedCensusTracts;