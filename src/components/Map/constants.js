export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoicGt1bGFuZGgiLCJhIjoiY20xNGZqbDBiMHhmdzJucHd5OTA4d2h2bCJ9.J6GeFa6bPfwMKqufI9L3MA';
export const TILESET_INFO = [
    { id: 'pkulandh.aqi_20241014_00_to_20241014_05', layer: '20241014_00_to_20241014_05', date: '2024-10-14', startHour: 0 },
    { id: 'pkulandh.aqi_20241014_06_to_20241014_11', layer: '20241014_06_to_20241014_11', date: '2024-10-14', startHour: 6 },
    { id: 'pkulandh.aqi_20241015_12_to_20241015_17', layer: '20241015_12_to_20241015_17', date: '2024-10-15', startHour: 12 },
    { id: 'pkulandh.aqi_20241015_18_to_20241015_23', layer: '20241015_18_to_20241015_23', date: '2024-10-15', startHour: 18 },
    { id: 'pkulandh.aqi_20241016_00_to_20241016_05', layer: '20241016_00_to_20241016_05', date: '2024-10-16', startHour: 0 },
    { id: 'pkulandh.aqi_20241016_06_to_20241016_11', layer: '20241016_06_to_20241016_11', date: '2024-10-16', startHour: 6 },
    { id: 'pkulandh.aqi_20241016_12_to_20241016_17', layer: '20241016_12_to_20241016_17', date: '2024-10-16', startHour: 12 },
    { id: 'pkulandh.aqi_20241016_18_to_20241016_23', layer: '20241016_18_to_20241016_23', date: '2024-10-16', startHour: 18 },
    { id: 'pkulandh.aqi_20241017_00_to_20241017_05', layer: '20241017_00_to_20241017_05', date: '2024-10-17', startHour: 0 },
    { id: 'pkulandh.aqi_20241017_06_to_20241017_11', layer: '20241017_06_to_20241017_11', date: '2024-10-17', startHour: 6 },
    { id: 'pkulandh.aqi_20241017_12_to_20241017_17', layer: '20241017_12_to_20241017_17', date: '2024-10-17', startHour: 12 },
    { id: 'pkulandh.aqi_20241017_18_to_20241017_23', layer: '20241017_18_to_20241017_23', date: '2024-10-17', startHour: 18 },
    { id: 'pkulandh.aqi_20241018_00_to_20241018_05', layer: '20241018_00_to_20241018_05', date: '2024-10-18', startHour: 0 },
    { id: 'pkulandh.aqi_20241018_06_to_20241018_11', layer: '20241018_06_to_20241018_11', date: '2024-10-18', startHour: 6 },
    { id: 'pkulandh.aqi_20241018_12_to_20241018_17', layer: '20241018_12_to_20241018_17', date: '2024-10-18', startHour: 12 },
    { id: 'pkulandh.aqi_20241018_18_to_20241018_23', layer: '20241018_18_to_20241018_23', date: '2024-10-18', startHour: 18 },
  ];
export const START_DATE = new Date('2024-10-14T00:00:00');
export const END_DATE = new Date('2024-10-17T23:59:59');
export const SKIPPED_HOURS = 24;
export const TOTAL_HOURS = Math.floor((END_DATE - START_DATE) / (1000 * 60 * 60)) - SKIPPED_HOURS;

