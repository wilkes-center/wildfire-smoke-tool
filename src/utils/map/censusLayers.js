// src/utils/map/censusLayers.js

export const setupCensusLayers = (map, isDarkMode) => {
  if (!map || !map.getStyle()) {
    console.debug('Map or style not ready for census layer setup');
    return false;
  }

  try {
    // Clean up existing layers first
    cleanupCensusLayers(map);

    // Add census tracts source
    map.addSource('census-tracts', {
      type: 'vector',
      url: 'mapbox://pkulandh.3r0plqr0'
    });

    // Add fill layer for census tracts
    map.addLayer({
      id: 'census-tracts-layer',
      type: 'fill',
      source: 'census-tracts',
      'source-layer': 'cb_2019_us_tract_500k-2qnt3v',
      paint: {
        'fill-color': isDarkMode ? '#374151' : '#6B7280',
        'fill-opacity': 0.1,
        'fill-outline-color': isDarkMode ? '#4B5563' : '#374151'
      }
    });

    console.debug('Census tract layers setup complete');
    return true;
  } catch (error) {
    console.error('Error setting up census tract layers:', error);
    return false;
  }
};

export const cleanupCensusLayers = (map) => {
  if (!map) return;

  try {
    const layers = ['census-tracts-layer'];
    layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    if (map.getSource('census-tracts')) {
      map.removeSource('census-tracts');
    }
  } catch (error) {
    console.error('Error cleaning up census layers:', error);
  }
};

export const updateCensusLayerColors = (map, isDarkMode) => {
  if (!map) return;

  try {
    if (map.getLayer('census-tracts-layer')) {
      map.setPaintProperty(
        'census-tracts-layer',
        'fill-color',
        isDarkMode ? '#374151' : '#6B7280'
      );
      map.setPaintProperty(
        'census-tracts-layer',
        'fill-outline-color',
        isDarkMode ? '#4B5563' : '#374151'
      );
    } else {
      // If layer doesn't exist, try to recreate it
      setupCensusLayers(map, isDarkMode);
    }
  } catch (error) {
    console.error('Error updating census layer colors:', error);
  }
};
  
  export const updateCensusLayerVisibility = (map, visible) => {
    if (!map) return;
  
    const opacity = visible ? 1 : 0;
    
    try {
      if (map.getLayer('census-tracts-layer')) {
        map.setPaintProperty('census-tracts-layer', 'fill-opacity', opacity * 0.1);
      }
      if (map.getLayer('census-tracts-outline')) {
        map.setPaintProperty('census-tracts-outline', 'line-opacity', opacity);
      }
    } catch (error) {
      console.error('Error updating census layer visibility:', error);
    }
  };
  
