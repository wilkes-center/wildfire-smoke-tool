// src/utils/map/CensusLayerManager.js
import { waitForMapReady, removeLayerAndSource, updateLayerColors } from './layerUtils';

const CENSUS_SOURCE_ID = 'census-tracts';
const CENSUS_LAYER_ID = 'census-tracts-layer';
const CENSUS_COLORS = {
  'fill-color': {
    light: '#6B7280',
    dark: '#374151'
  },
  'fill-outline-color': {
    light: '#374151',
    dark: '#4B5563'
  }
};

class CensusLayerManager {
    constructor() {
      this.layerInitialized = false;
      this.progressCallbacks = new Set();
      this.initPromise = null;
    }
  
    // Register progress callback
    onProgress(callback) {
      this.progressCallbacks.add(callback);
      return () => this.progressCallbacks.delete(callback);
    }
  
    // Notify progress to all registered callbacks
    notifyProgress(stage, progress) {
      this.progressCallbacks.forEach(callback => 
        callback({ stage, progress })
      );
    }
  
    // Initialize census tract layer
    async initializeLayer(map, isDarkMode) {
      if (!map) throw new Error('Map instance is required');
      
      // If already initializing, return existing promise
      if (this.initPromise) return this.initPromise;
      
      this.initPromise = (async () => {
        try {
          this.notifyProgress('layer', 0);
          
          // Wait for map to be ready
          const isReady = await waitForMapReady(map);
          if (!isReady) {
            throw new Error('Map not ready after maximum attempts');
          }
          
          this.notifyProgress('layer', 30);
          
          // Clean up existing layers
          removeLayerAndSource(map, CENSUS_LAYER_ID, CENSUS_SOURCE_ID);
          
          this.notifyProgress('layer', 50);
          
          // Add census tracts source
          map.addSource(CENSUS_SOURCE_ID, {
            type: 'vector',
            url: 'mapbox://pkulandh.3r0plqr0',
            maxzoom: 12,
            minzoom: 4
          });
          
          this.notifyProgress('layer', 70);
          
          // Add fill layer for census tracts
          map.addLayer({
            id: CENSUS_LAYER_ID,
            type: 'fill',
            source: CENSUS_SOURCE_ID,
            'source-layer': 'cb_2019_us_tract_500k-2qnt3v',
            minzoom: 4,
            maxzoom: 12,
            paint: {
              'fill-color': isDarkMode ? CENSUS_COLORS['fill-color'].dark : CENSUS_COLORS['fill-color'].light,
              'fill-opacity': 0,
              'fill-outline-color': isDarkMode ? CENSUS_COLORS['fill-outline-color'].dark : CENSUS_COLORS['fill-outline-color'].light
            }
          });
          
          this.notifyProgress('layer', 90);
          
          this.layerInitialized = true;
          this.notifyProgress('layer', 100);
          
          return {
            success: true,
            layerInitialized: this.layerInitialized
          };
        } catch (error) {
          console.error('Error initializing census tract layer:', error);
          this.layerInitialized = false;
          throw error;
        } finally {
          this.initPromise = null;
        }
      })();
      
      return this.initPromise;
    }
  
    // Update layer colors
    updateColors(map, isDarkMode) {
      updateLayerColors(map, CENSUS_LAYER_ID, CENSUS_COLORS, isDarkMode);
    }
  
    // Update layer visibility
    updateVisibility(map, visible) {
      if (!map || !map.getLayer(CENSUS_LAYER_ID)) return;
      
      try {
        const opacity = visible ? 0.1 : 0;
        map.setPaintProperty(CENSUS_LAYER_ID, 'fill-opacity', opacity);
      } catch (error) {
        console.error('Error updating census layer visibility:', error);
      }
    }
  
    // Clean up census layers
    cleanupLayers(map) {
      removeLayerAndSource(map, CENSUS_LAYER_ID, CENSUS_SOURCE_ID);
    }
  
    // Load and initialize everything
    async preloadAll(map, isDarkMode) {
      if (!map) throw new Error('Map instance is required');
      
      try {
        this.notifyProgress('overall', 0);
        await this.initializeLayer(map, isDarkMode);
        this.notifyProgress('overall', 100);
        
        return {
          success: true,
          layerInitialized: this.layerInitialized
        };
      } catch (error) {
        console.error('Error in preloadAll:', error);
        throw error;
      }
    }
  
    // Complete cleanup
    cleanup(map) {
      this.cleanupLayers(map);
      this.layerInitialized = false;
      this.progressCallbacks.clear();
    }
  }
  
  export const censusLayerManager = new CensusLayerManager();