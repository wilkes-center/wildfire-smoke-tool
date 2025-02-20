// src/utils/map/censusPreloader.js

class CensusPreloader {
    constructor() {
      this.layerInitialized = false;
      this.onProgressCallbacks = new Set();
      this.initPromise = null;
    }
  
    onProgress(callback) {
      this.onProgressCallbacks.add(callback);
      return () => this.onProgressCallbacks.delete(callback);
    }
  
    notifyProgress(stage, progress) {
      this.onProgressCallbacks.forEach(callback => 
        callback({ stage, progress })
      );
    }
  
    async waitForMapReady(map, maxAttempts = 10) {
      if (!map) return false;
  
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (map.isStyleLoaded()) return true;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return false;
    }
  
    async initializeLayer(map, isDarkMode) {
      if (!map) throw new Error('Map instance is required');
  
      // If already initializing, return existing promise
      if (this.initPromise) return this.initPromise;
  
      this.initPromise = (async () => {
        try {
          this.notifyProgress('layer', 0);
  
          // Wait briefly for map to be ready
          const isReady = await this.waitForMapReady(map);
          if (!isReady) {
            throw new Error('Map not ready after maximum attempts');
          }
  
          this.notifyProgress('layer', 30);
  
          // Remove existing layers if present
          if (map.getLayer('census-tracts-layer')) {
            map.removeLayer('census-tracts-layer');
          }
          if (map.getSource('census-tracts')) {
            map.removeSource('census-tracts');
          }
  
          this.notifyProgress('layer', 50);
  
          // Add source with optimized settings
          map.addSource('census-tracts', {
            type: 'vector',
            url: 'mapbox://pkulandh.3r0plqr0',
            maxzoom: 12,
            minzoom: 4
          });
  
          this.notifyProgress('layer', 70);
  
          // Add layer with optimized settings
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
  
          // Quick source load check
          const source = map.getSource('census-tracts');
          if (!source) {
            throw new Error('Failed to create census tracts source');
          }
  
          this.layerInitialized = true;
          this.notifyProgress('layer', 100);
  
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
  
    // Single preload function with better error handling
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
  
    cleanup(map) {
      if (!map) return;
  
      try {
        if (map.getLayer('census-tracts-layer')) {
          map.removeLayer('census-tracts-layer');
        }
        if (map.getSource('census-tracts')) {
          map.removeSource('census-tracts');
        }
        this.layerInitialized = false;
        this.onProgressCallbacks.clear();
      } catch (error) {
        console.warn('Error during census preloader cleanup:', error);
      }
    }
  }
  
  // Export singleton instance
  export const censusPreloader = new CensusPreloader();