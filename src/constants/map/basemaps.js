export const BASEMAPS = {
  light: {
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    name: 'Light'
  },
  dark: {
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    name: 'Dark'
  },
  satellite: {
    url: 'mapbox://styles/mapbox/satellite-v9',
    name: 'Satellite'
  },
  population: {
    url: 'mapbox://styles/mapbox/light-v11',
    name: 'Population Density',
    layers: [
      {
        id: 'population-density',
        type: 'raster',
        source: {
          type: 'raster',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512
        },
        paint: {
          'raster-opacity': 0.6
        }
      }
    ]
  }
};