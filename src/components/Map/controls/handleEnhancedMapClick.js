// Function to handle zooming and selection
const handleEnhancedMapClick = async (e, map, options = {}) => {
  const {
    initialZoomLevel = 7,
    zoomDuration = 1000,
    selectionDelay = 500,
    selectionRadius = 0.1
  } = options;

  const { lng, lat } = e.lngLat;

  // First, zoom to the clicked location
  await new Promise(resolve => {
    map.flyTo({
      center: [lng, lat],
      zoom: initialZoomLevel,
      duration: zoomDuration,
      essential: true
    });

    // Wait for the zoom animation to complete
    map.once('moveend', resolve);
  });

  // Wait a brief moment after zoom completes
  await new Promise(resolve => setTimeout(resolve, selectionDelay));

  // Create circle polygon for selection
  const circlePoints = createCirclePolygon([lng, lat], selectionRadius);

  return {
    type: 'point',
    center: [lng, lat],
    polygon: circlePoints
  };
};

// Helper function to create a circle polygon
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

export default handleEnhancedMapClick;
