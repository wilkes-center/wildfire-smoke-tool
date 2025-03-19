// src/utils/map/colors.js
import { PM25_LEVELS, getPM25ColorInterpolation } from '../../constants/pm25Levels';

export { getPM25ColorInterpolation, PM25_LEVELS };

export const NEON_PM25_COLORS = {
  darkMode: {
    good: PM25_LEVELS[0].darkColor,
    moderate: PM25_LEVELS[1].darkColor,
    usg: PM25_LEVELS[2].darkColor,
    unhealthy: PM25_LEVELS[3].darkColor,
    veryUnhealthy: PM25_LEVELS[4].darkColor,
    hazardous: PM25_LEVELS[5].darkColor
  },
  lightMode: {
    good: PM25_LEVELS[0].color,
    moderate: PM25_LEVELS[1].color,
    usg: PM25_LEVELS[2].color,
    unhealthy: PM25_LEVELS[3].color,
    veryUnhealthy: PM25_LEVELS[4].color,
    hazardous: PM25_LEVELS[5].color
  }
};