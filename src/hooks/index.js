// Map state hooks
export { useMapState } from './map/useMapState';
export { useTimeState } from './map/useTimeState';
export { useThemeState } from './map/useThemeState';
export { useDrawingState } from './map/useDrawingState';
export { useUIState } from './map/useUIState';

// Map interaction hooks
export { useMapInteraction } from './map/useMapInteraction';
export { useDrawingInteraction, DOUBLE_CLICK_THRESHOLD } from './map/useDrawingInteraction';
export { useThemeControl } from './map/useThemeControl';
export { useDateTimeCalculator } from './map/useDateTimeCalculator';
export { usePolygonVisualization } from './map/usePolygonVisualization';
export { useTourManager } from './map/useTourManager';
export { useCensusDataManager } from './map/useCensusDataManager';

// Re-export existing hooks
export { useMapLayers } from './map/useMapLayers';
export { useTimeAnimation } from './map/useTimeAnimation';
export { useAreaSelection } from './map/useAreaSelection';
export { useCensusPreloader } from './map/useCensusPreloader';
