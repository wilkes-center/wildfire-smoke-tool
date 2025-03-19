// src/utils/map/CensusLayerManager.js
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
  
    // Wait for map to be ready
    async waitForMapReady(map, maxAttempts = 10) {
      if (!map) return false;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (map.isStyleLoaded()) return true;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return false;
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
          const isReady = await this.waitForMapReady(map);
          if (!isReady) {
            throw new Error('Map not ready after maximum attempts');
          }
          
          this.notifyProgress('layer', 30);
          
          // Clean up existing layers
          this.cleanupLayers(map);
          
          this.notifyProgress('layer', 50);
          
          // Add census tracts source
          map.addSource('census-tracts', {
            type: 'vector',
            url: 'mapbox://pkulandh.3r0plqr0',
            maxzoom: 12,
            minzoom: 4
          });
          
          this.notifyProgress('layer', 70);
          
          // Add fill layer for census tracts
          map.addLayer({
            id: 'census-tracts-layer',
            type: 'fill',
            source: 'census-tracts',
            'source-layer': 'cb_2019_us_tract_500k-2qnt3v',
            minzoom: 4,
            maxzoom: 12,
            paint: {
              'fill-color': isDarkMode ? '#374151' : '#6B7280',
              'fill-opacity': 0,
              'fill-outline-color': isDarkMode ? '#4B5563' : '#374151'
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
      if (!map || !map.getLayer('census-tracts-layer')) return;
      
      try {
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
      } catch (error) {
        console.warn('Error updating census layer colors:', error);
      }
    }
  
    // Update layer visibility
    updateVisibility(map, visible) {
      if (!map || !map.getLayer('census-tracts-layer')) return;
      
      try {
        const opacity = visible ? 0.1 : 0;
        map.setPaintProperty('census-tracts-layer', 'fill-opacity', opacity);
      } catch (error) {
        console.error('Error updating census layer visibility:', error);
      }
    }
  
    // Clean up census layers
    cleanupLayers(map) {
      if (!map) return;
      
      try {
        if (map.getLayer('census-tracts-layer')) {
          map.removeLayer('census-tracts-layer');
        }
        if (map.getSource('census-tracts')) {
          map.removeSource('census-tracts');
        }
      } catch (error) {
        console.warn('Error cleaning up census layers:', error);
      }
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