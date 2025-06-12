/**
 * Utility functions for geometric operations
 */

/**
 * Checks if a point is inside a polygon using the ray-casting algorithm
 * @param {Array} point - [lng, lat] coordinates of the point to check
 * @param {Array} polygon - Array of [lng, lat] coordinates forming the polygon
 * @returns {boolean} True if the point is inside the polygon
 */
export const isPointInPolygon = (point, polygon) => {
  if (!Array.isArray(point) || point.length < 2) {
    return false;
  }

  const x = point[0],
    y = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Calculates the bounding box of a polygon
 * @param {Array} polygon - Array of [lng, lat] coordinates
 * @returns {Object} Bounding box with minLng, maxLng, minLat, maxLat
 */
export const getBoundingBox = polygon => {
  return polygon.reduce(
    (bounds, [lng, lat]) => ({
      minLng: Math.min(bounds.minLng, lng),
      maxLng: Math.max(bounds.maxLng, lng),
      minLat: Math.min(bounds.minLat, lat),
      maxLat: Math.max(bounds.maxLat, lat)
    }),
    {
      minLng: Infinity,
      maxLng: -Infinity,
      minLat: Infinity,
      maxLat: -Infinity
    }
  );
};

/**
 * Calculates the area of a polygon in square kilometers
 * @param {Array} polygon - Array of [lng, lat] coordinates forming the polygon
 * @returns {number} Area in square kilometers
 */
export const calculatePolygonArea = polygon => {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return 0;
  }

  // Convert degrees to radians
  const toRadians = degrees => degrees * (Math.PI / 180);

  // Earth's radius in kilometers
  const EARTH_RADIUS = 6371;

  // Calculate area using spherical excess formula for better accuracy
  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRadians(polygon[i][1]);
    const lat2 = toRadians(polygon[j][1]);
    const deltaLng = toRadians(polygon[j][0] - polygon[i][0]);

    area += deltaLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * EARTH_RADIUS * EARTH_RADIUS) / 2;

  return area;
};
