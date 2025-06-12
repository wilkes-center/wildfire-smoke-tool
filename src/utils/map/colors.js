// Directly re-export from pm25Levels to eliminate redundancy
export { PM25_LEVELS, getPM25Level, getPM25ColorInterpolation } from '../../constants/pm25Levels';

// This mapping is the only unique functionality in this file
export const NEON_PM25_COLORS = {
  darkMode: {
    good: '#00ff9d', // PM25_LEVELS[0].darkColor
    moderate: '#fff700', // PM25_LEVELS[1].darkColor
    usg: '#ff9100', // PM25_LEVELS[2].darkColor
    unhealthy: '#ff0055', // PM25_LEVELS[3].darkColor
    veryUnhealthy: '#bf00ff', // PM25_LEVELS[4].darkColor
    hazardous: '#ff00ff' // PM25_LEVELS[5].darkColor
  },
  lightMode: {
    good: '#00e400', // PM25_LEVELS[0].color
    moderate: '#ffff00', // PM25_LEVELS[1].color
    usg: '#ff7e00', // PM25_LEVELS[2].color
    unhealthy: '#ff0000', // PM25_LEVELS[3].color
    veryUnhealthy: '#8f3f97', // PM25_LEVELS[4].color
    hazardous: '#7e0023' // PM25_LEVELS[5].color
  }
};
