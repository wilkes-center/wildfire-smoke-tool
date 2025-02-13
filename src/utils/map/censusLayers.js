// src/utils/map/censusLayers.js

export const setupCensusLayers = (map, isDarkMode) => {
    if (!map || !map.getStyle()) return;
    
    try {
      // Remove existing layers if they exist
      const layersToRemove = ['census-tracts-layer', 'census-tracts-outline'];
      layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
  
      // Remove existing source if it exists
      if (map.getSource('census-tracts')) {
        map.removeSource('census-tracts');
      }
  
      // Add census tracts source
      map.addSource('census-tracts', {
        type: 'vector',
        url: 'mapbox://pkulandh.3r0plqr0'  // Census tileset ID
      });
  
      // Add fill layer for census tracts
      map.addLayer({
        id: 'census-tracts-layer',
        type: 'fill',
        source: 'census-tracts',
        'source-layer': 'cb_2019_us_tract_500k-2qnt3v',  // Source layer name
        paint: {
          'fill-color': isDarkMode ? '#374151' : '#6B7280',
          'fill-opacity': 0,
          'fill-outline-color': isDarkMode ? '#4B5563' : '#374151'
        }
      });
  
      // Add outline layer for census tracts
      map.addLayer({
        id: 'census-tracts-outline',
        type: 'line',
        source: 'census-tracts',
        'source-layer': 'cb_2019_us_tract_500k-2qnt3v',  // Source layer name
        paint: {
          'line-color': isDarkMode ? '#4B5563' : '#374151',
          'line-width': 1,
          'line-opacity': 0
        }
      });
  
      console.log('Census tract layers setup complete');
    } catch (error) {
      console.error('Error setting up census tract layers:', error);
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
      }
      if (map.getLayer('census-tracts-outline')) {
        map.setPaintProperty(
          'census-tracts-outline',
          'line-color',
          isDarkMode ? '#4B5563' : '#374151'
        );
      }
    } catch (error) {
      console.error('Error updating census layer colors:', error);
    }
  };