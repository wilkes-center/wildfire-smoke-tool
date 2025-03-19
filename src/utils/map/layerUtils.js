/**
 * Shared utilities for map layer operations
 */

/**
 * Safely removes a layer and its source from the map
 * @param {Object} map - The mapbox-gl map instance
 * @param {string} layerId - The ID of the layer to remove
 * @param {string} sourceId - The ID of the source to remove
 */
export const removeLayerAndSource = (map, layerId, sourceId) => {
  if (!map) return;

  try {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch (error) {
    console.warn(`Error removing layer/source (${layerId}/${sourceId}):`, error);
  }
};

/**
 * Safely waits for the map style to be loaded
 * @param {Object} map - The mapbox-gl map instance
 * @param {number} maxAttempts - Maximum number of attempts to check if style is loaded
 * @returns {Promise<boolean>} - True if style loaded successfully
 */
export const waitForMapReady = async (map, maxAttempts = 10) => {
  if (!map) return false;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (map.isStyleLoaded()) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
};

/**
 * Updates the color properties of a layer based on dark mode
 * @param {Object} map - The mapbox-gl map instance
 * @param {string} layerId - The ID of the layer to update
 * @param {Object} colors - Colors object with light/dark variants
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 */
export const updateLayerColors = (map, layerId, colors, isDarkMode) => {
  if (!map || !map.getLayer(layerId)) return;
  
  try {
    for (const [property, options] of Object.entries(colors)) {
      map.setPaintProperty(
        layerId,
        property,
        isDarkMode ? options.dark : options.light
      );
    }
  } catch (error) {
    console.warn(`Error updating colors for layer ${layerId}:`, error);
  }
};