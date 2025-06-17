/**
 * Shared utility for getting drawing instructions based on polygon state
 * Used by both tooltip and helper overlay components
 */
export const getDrawingInstructions = tempPolygonLength => {
  if (tempPolygonLength === 0) {
    return 'Click to start drawing';
  }

  if (tempPolygonLength === 1) {
    return 'Click to add points';
  }

  if (tempPolygonLength === 2) {
    return 'Add 1 more point to form a shape';
  }

  return 'Double-click to finish';
};

/**
 * Helper to determine if a polygon can be completed
 * @param {Array} polygon - Current polygon points
 * @returns {boolean} - Whether the polygon can be completed
 */
export const canCompletePolygon = polygon => {
  return Array.isArray(polygon) && polygon.length >= 3;
};
