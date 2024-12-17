import mapboxgl from 'mapbox-gl';

export const setupLandBoundaries = (map) => {
  if (!map || map.getSource('land-boundaries')) return;

  // Add land boundary source
  map.addSource('land-boundaries', {
    type: 'vector',
    url: 'mapbox://mapbox.boundaries-adm0-v3'
  });

  // Add invisible fill layer for land detection
  map.addLayer({
    id: 'land-boundaries-fill',
    type: 'fill',
    source: 'land-boundaries',
    'source-layer': 'boundaries_admin_0',
    paint: {
      'fill-opacity': 0  // Invisible but clickable
    }
  });
};

export const isOverLand = (map, point) => {
  if (!map) return false;

  try {
    const features = map.queryRenderedFeatures(
      map.project([point.lng, point.lat]),
      { layers: ['land-boundaries-fill'] }
    );
    return features.length > 0;
  } catch (error) {
    console.error('Error checking if point is over land:', error);
    return false;
  }
};

export const handleAreaSelection = (map, point, radius = 0.1) => {
  if (!map || !isOverLand(map, point)) {
    return null;
  }

  // Create circle polygon around point
  const circlePoints = createCirclePolygon([point.lng, point.lat], radius);
  
  // Create and zoom to bounds
  const bounds = circlePoints.reduce(
    (bounds, coord) => bounds.extend(coord),
    new mapboxgl.LngLatBounds([point.lng, point.lat], [point.lng, point.lat])
  );

  map.fitBounds(bounds, {
    padding: 50,
    maxZoom: 7,
    duration: 1000
  });

  return circlePoints;
};

// Helper function to create circle polygon
const createCirclePolygon = (center, radiusDegrees) => {
  const points = 64;
  const coords = [];
  
  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const dx = radiusDegrees * Math.cos((angle * Math.PI) / 180);
    const dy = radiusDegrees * Math.sin((angle * Math.PI) / 180);
    coords.push([center[0] + dx, center[1] + dy]);
  }
  
  coords.push(coords[0]); // Close the polygon
  return coords;
};

// Configuration for interactive layers
export const mapConfig = {
  interactiveLayerIds: ['land-boundaries-fill']
};

// Utility to clean up land boundary layers/sources
export const cleanupLandBoundaries = (map) => {
  if (!map) return;

  try {
    if (map.getLayer('land-boundaries-fill')) {
      map.removeLayer('land-boundaries-fill');
    }
    if (map.getSource('land-boundaries')) {
      map.removeSource('land-boundaries');
    }
  } catch (error) {
    console.error('Error cleaning up land boundaries:', error);
  }
};