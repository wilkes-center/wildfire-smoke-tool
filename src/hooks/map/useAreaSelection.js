import { useCallback, useEffect, useState } from 'react';

export const POINT_RADIUS = 0.1;

const createCirclePolygon = (center, radiusDegrees) => {
  const points = 64;
  const coords = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const dx = radiusDegrees * Math.cos((angle * Math.PI) / 180);
    const dy = radiusDegrees * Math.sin((angle * Math.PI) / 180);
    coords.push([center[0] + dx, center[1] + dy]);
  }

  coords.push(coords[0]);
  return coords;
};

export const useAreaSelection = (mapInstance, setIsPlaying, onAreaSelected) => {
  const [drawingMode, setDrawingMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [tempPolygon, setTempPolygon] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mousePosition, setMousePosition] = useState(null);

  // Handle mouse move during drawing
  useEffect(() => {
    if (!mapInstance || !drawingMode) return;

    const handleMouseMove = e => {
      const { lng, lat } = e.lngLat;
      setMousePosition([lng, lat]);
    };

    mapInstance.on('mousemove', handleMouseMove);
    return () => {
      mapInstance.off('mousemove', handleMouseMove);
    };
  }, [mapInstance, drawingMode]);

  const startDrawing = useCallback(() => {
    setDrawingMode(true);
    setSelectionMode(false);
    setTempPolygon([]);
    setPolygon(null);
    setSelectedPoint(null);
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = 'crosshair';
    }
  }, [mapInstance]);

  const startPointSelection = useCallback(() => {
    setSelectionMode(true);
    setDrawingMode(false);
    setTempPolygon([]);
    setPolygon(null);
    setSelectedPoint(null);
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = 'pointer';
    }
  }, [mapInstance]);

  const handleMapClick = useCallback(
    e => {
      if (!drawingMode && !selectionMode) return;

      const { lng, lat } = e.lngLat;

      if (drawingMode) {
        // Handle double click
        if (e.originalEvent.detail === 2 && tempPolygon.length >= 2) {
          const finalPolygon = [...tempPolygon, tempPolygon[0]];
          setPolygon(finalPolygon);
          setDrawingMode(false);
          setTempPolygon([]);

          if (mapInstance) {
            mapInstance.getCanvas().style.cursor = '';
          }

          onAreaSelected?.({
            type: 'polygon',
            points: tempPolygon,
            polygon: finalPolygon
          });
          return;
        }

        setTempPolygon(prev => [...prev, [lng, lat]]);
      } else if (selectionMode) {
        const point = [lng, lat];
        const circlePolygon = createCirclePolygon(point, POINT_RADIUS);

        setSelectedPoint(point);
        setPolygon(circlePolygon);
        setSelectionMode(false);

        if (mapInstance) {
          mapInstance.getCanvas().style.cursor = '';
        }

        onAreaSelected?.({
          type: 'point',
          center: point,
          radius: POINT_RADIUS,
          polygon: circlePolygon
        });
      }
    },
    [drawingMode, selectionMode, mapInstance, onAreaSelected, tempPolygon]
  );

  // Drawing preview effect
  useEffect(() => {
    if (!mapInstance || mapInstance._removed) return;

    const sourceId = 'polygon-source';
    const layerId = 'polygon-layer';
    const outlineLayerId = `${layerId}-outline`;
    const previewLayerId = `${layerId}-preview`;

    const cleanup = () => {
      if (mapInstance && !mapInstance._removed) {
        [previewLayerId, outlineLayerId, layerId].forEach(id => {
          if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
        });
        if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
      }
    };

    cleanup();

    if (tempPolygon.length > 0 || polygon) {
      try {
        // Add the source with either completed polygon or temp polygon
        const coordinates = polygon
          ? [polygon]
          : mousePosition && tempPolygon.length > 0
            ? [[...tempPolygon, mousePosition, tempPolygon[0]]]
            : [tempPolygon];

        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates
            }
          }
        });

        // Add fill layer
        mapInstance.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': 'blue',
            'fill-opacity': 0.2
          }
        });

        // Add outline layer
        mapInstance.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': 'blue',
            'line-width': 2
          }
        });

        // Add preview line layer (only during drawing)
        if (drawingMode && mousePosition && tempPolygon.length > 0) {
          mapInstance.addLayer({
            id: previewLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': 'blue',
              'line-width': 2,
              'line-dasharray': [2, 2]
            }
          });
        }
      } catch (error) {
        console.error('Error adding polygon layers:', error);
      }
    }

    return cleanup;
  }, [mapInstance, polygon, tempPolygon, mousePosition, drawingMode]);

  const clearPolygon = useCallback(() => {
    setPolygon(null);
    setTempPolygon([]);
    setDrawingMode(false);
    setSelectionMode(false);
    setSelectedPoint(null);
    setMousePosition(null);
    setIsPlaying(false);
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = '';
    }
  }, [mapInstance, setIsPlaying]);

  const getCursor = useCallback(() => {
    if (selectionMode) return 'pointer';
    if (drawingMode) return 'crosshair';
    return 'grab';
  }, [selectionMode, drawingMode]);

  return {
    drawingMode,
    selectionMode,
    polygon,
    tempPolygon,
    selectedPoint,
    startDrawing,
    startPointSelection,
    handleMapClick,
    clearPolygon,
    getCursor
  };
};
