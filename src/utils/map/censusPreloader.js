// src/utils/map/censusPreloader.js
import { fetchCensusPopulation } from './census-api';

class CensusPreloader {
  constructor() {
    this.censusData = null;
    this.isLoadingData = false;
    this.loadPromise = null;
    this.layerInitialized = false;
    this.onProgressCallbacks = new Set();
    this.sourceLoadAttempts = 0;
    this.MAX_SOURCE_LOAD_ATTEMPTS = 20; // Maximum number of attempts to check source loading
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

  async waitForSourceLoad(map, sourceId) {
    return new Promise((resolve, reject) => {
      const source = map.getSource(sourceId);
      
      // If source is already loaded, resolve immediately
      if (source && source.loaded()) {
        resolve(true);
        return;
      }

      let attempts = 0;
      const checkInterval = 250; // Check every 250ms
      const maxAttempts = this.MAX_SOURCE_LOAD_ATTEMPTS;

      const checker = setInterval(() => {
        attempts++;
        
        // Calculate and notify progress
        const loadProgress = Math.min(
          Math.floor((attempts / maxAttempts) * 100),
          90
        );
        this.notifyProgress('layer', loadProgress);

        const source = map.getSource(sourceId);
        if (source && source.loaded()) {
          clearInterval(checker);
          this.notifyProgress('layer', 100);
          resolve(true);
          return;
        }

        // Check if source exists and has tiles
        if (source && source.type === 'vector') {
          const tiles = source.tiles;
          if (tiles && tiles.length > 0) {
            // Check if any tiles are loaded
            const loaded = map.queryRenderedFeatures({ layers: ['census-tracts-layer'] });
            if (loaded && loaded.length > 0) {
              clearInterval(checker);
              this.notifyProgress('layer', 100);
              resolve(true);
              return;
            }
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(checker);
          reject(new Error('Timeout waiting for source to load'));
        }
      }, checkInterval);

      // Also listen for specific events
      const sourceDataHandler = (e) => {
        if (e.sourceId === sourceId && e.isSourceLoaded) {
          clearInterval(checker);
          map.off('sourcedata', sourceDataHandler);
          this.notifyProgress('layer', 100);
          resolve(true);
        }
      };

      map.on('sourcedata', sourceDataHandler);
    });
  }

  async initializeLayer(map, isDarkMode) {
    if (!map || !map.getStyle() || this.layerInitialized) return;

    try {
      this.notifyProgress('layer', 0);

      // Clean up existing layers
      if (map.getLayer('census-tracts-layer')) {
        map.removeLayer('census-tracts-layer');
      }
      if (map.getSource('census-tracts')) {
        map.removeSource('census-tracts');
      }

      this.notifyProgress('layer', 20);

      // Add census tracts source
      map.addSource('census-tracts', {
        type: 'vector',
        url: 'mapbox://pkulandh.3r0plqr0'
      });

      this.notifyProgress('layer', 40);

      // Add layer
      map.addLayer({
        id: 'census-tracts-layer',
        type: 'fill',
        source: 'census-tracts',
        'source-layer': 'cb_2019_us_tract_500k-2qnt3v',
        paint: {
          'fill-color': isDarkMode ? '#374151' : '#6B7280',
          'fill-opacity': 0,
          'fill-outline-color': isDarkMode ? '#4B5563' : '#374151'
        }
      });

      this.notifyProgress('layer', 60);

      // Wait for source to fully load
      await this.waitForSourceLoad(map, 'census-tracts');

      this.layerInitialized = true;

    } catch (error) {
      console.error('Error initializing census tract layer:', error);
      throw error;
    }
  }

  async preloadData() {
    if (this.censusData) return this.censusData;
    if (this.isLoadingData) return this.loadPromise;

    try {
      this.isLoadingData = true;
      this.notifyProgress('data', 0);

      // Start the data loading
      this.loadPromise = fetchCensusPopulation();

      // Setup progress monitoring
      const startTime = Date.now();
      const expectedDuration = 5000; // Expect loading to take about 5 seconds
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(Math.floor((elapsed / expectedDuration) * 90), 90);
        this.notifyProgress('data', progress);
      }, 100);

      this.censusData = await this.loadPromise;
      
      clearInterval(progressInterval);
      this.notifyProgress('data', 100);

      return this.censusData;

    } catch (error) {
      console.error('Error preloading census data:', error);
      throw error;
    } finally {
      this.isLoadingData = false;
      this.loadPromise = null;
    }
  }

  async preloadAll(map, isDarkMode) {
    this.notifyProgress('overall', 0);

    try {
      // Start both operations concurrently
      const results = await Promise.all([
        this.initializeLayer(map, isDarkMode),
        this.preloadData()
      ]);

      this.notifyProgress('overall', 100);

      return {
        success: true,
        censusData: results[1],
        layerInitialized: this.layerInitialized
      };

    } catch (error) {
      console.error('Error in preloadAll:', error);
      throw error;
    }
  }

  updateColors(map, isDarkMode) {
    if (!map || !map.getLayer('census-tracts-layer')) return;

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
  }
}

// Export singleton instance
export const censusPreloader = new CensusPreloader();