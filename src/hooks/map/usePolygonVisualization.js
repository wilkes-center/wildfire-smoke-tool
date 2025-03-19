import { useEffect } from 'react';

export const usePolygonVisualization = ({
  mapInstance,
  polygon,
  tempPolygon,
  mousePosition,
  drawingMode,
  isDarkMode
}) => {
  useEffect(() => {
    if (!mapInstance || mapInstance._removed) return;
  
    const sourceId = 'polygon-source';
    const layerId = 'polygon-layer';
    const outlineLayerId = `${layerId}-outline`;
    const previewLayerId = `${layerId}-preview`;
    const vertexSourceId = `${sourceId}-vertices`;
    const vertexLayerId = `${layerId}-vertices`;
  
    const initializePolygonResources = () => {
      if (!mapInstance.getSource(sourceId)) {
        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[]]
            }
          }
        });
      }
      
      if (!mapInstance.getSource(vertexSourceId)) {
        mapInstance.addSource(vertexSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }
      
      if (!mapInstance.getLayer(layerId)) {
        mapInstance.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'fill-opacity': isDarkMode ? 0.3 : 0.2
          }
        });
      }
  
      if (!mapInstance.getLayer(outlineLayerId)) {
        mapInstance.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'line-width': 2
          }
        });
      }
  
      if (!mapInstance.getLayer(previewLayerId)) {
        mapInstance.addLayer({
          id: previewLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'line-width': 2,
            'line-dasharray': [2, 2]
          },
          layout: {
            'visibility': 'none'
          }
        });
      }
  
      if (!mapInstance.getLayer(vertexLayerId)) {
        mapInstance.addLayer({
          id: vertexLayerId,
          type: 'circle',
          source: vertexSourceId,
          paint: {
            'circle-radius': 5,
            'circle-color': isDarkMode ? '#60A5FA' : '#3B82F6',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'white'
          }
        });
      }
    };
    
    const updatePolygonData = () => {
      if (mapInstance.getSource(sourceId)) {
        const coordinates = polygon ? [polygon] : 
          tempPolygon.length > 0 && mousePosition ? [[...tempPolygon, mousePosition, tempPolygon[0]]] : 
          tempPolygon.length > 0 ? [tempPolygon] : [[]];
            
        mapInstance.getSource(sourceId).setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates
          }
        });
      }
  
      if (mapInstance.getSource(vertexSourceId)) {
        mapInstance.getSource(vertexSourceId).setData({
          type: 'FeatureCollection',
          features: tempPolygon.map(coord => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coord
            }
          }))
        });
      }
  
      if (mapInstance.getLayer(previewLayerId)) {
        const showPreview = drawingMode && mousePosition && tempPolygon.length > 0;
        mapInstance.setLayoutProperty(
          previewLayerId,
          'visibility',
          showPreview ? 'visible' : 'none'
        );
      }
  
      if (mapInstance.getLayer(vertexLayerId)) {
        mapInstance.setLayoutProperty(
          vertexLayerId, 
          'visibility', 
          tempPolygon.length > 0 ? 'visible' : 'none'
        );
      }
    };
  
    try {
      initializePolygonResources();
      updatePolygonData();
    } catch (error) {
      console.error('Error managing polygon visualization:', error);
    }
  }, [
    mapInstance,
    polygon,
    tempPolygon,
    mousePosition,
    drawingMode,
    isDarkMode
  ]);
};
