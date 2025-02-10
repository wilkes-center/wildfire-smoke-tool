// File: src/utils/map/colors.js

export const NEON_PM25_COLORS = {
    darkMode: {
      good: '#00ff9d',        // Neon mint green
      moderate: '#fff700',    // Neon yellow
      usg: '#ff9100',        // Neon orange
      unhealthy: '#ff0055',  // Neon pink/red
      veryUnhealthy: '#bf00ff', // Neon purple
      hazardous: '#ff00ff'   // Neon magenta
    },
    lightMode: {
      good: '#00e400',       // Original green
      moderate: '#ffff00',   // Original yellow
      usg: '#ff7e00',       // Original orange
      unhealthy: '#ff0000', // Original red
      veryUnhealthy: '#8f3f97', // Original purple
      hazardous: '#7e0023'  // Original dark red
    }
  };
  
  export const getPM25ColorInterpolation = (isDarkMode) => [
    'interpolate',
    ['linear'],
    ['coalesce', ['to-number', ['get', 'PM25'], 0], 0],
    0, isDarkMode ? NEON_PM25_COLORS.darkMode.good : NEON_PM25_COLORS.lightMode.good,
    12.1, isDarkMode ? NEON_PM25_COLORS.darkMode.moderate : NEON_PM25_COLORS.lightMode.moderate,
    35.5, isDarkMode ? NEON_PM25_COLORS.darkMode.usg : NEON_PM25_COLORS.lightMode.usg,
    55.5, isDarkMode ? NEON_PM25_COLORS.darkMode.unhealthy : NEON_PM25_COLORS.lightMode.unhealthy,
    150.5, isDarkMode ? NEON_PM25_COLORS.darkMode.veryUnhealthy : NEON_PM25_COLORS.lightMode.veryUnhealthy,
    250.5, isDarkMode ? NEON_PM25_COLORS.darkMode.hazardous : NEON_PM25_COLORS.lightMode.hazardous
  ];
  
  // Updated PM25 levels with neon colors
  export const PM25_LEVELS = [
    { 
      value: 0, 
      label: 'Good',
      darkColor: NEON_PM25_COLORS.darkMode.good,
      lightColor: NEON_PM25_COLORS.lightMode.good,
      textDark: 'text-emerald-400',
      textLight: 'text-emerald-700'
    },
    { 
      value: 12.1, 
      label: 'Moderate',
      darkColor: NEON_PM25_COLORS.darkMode.moderate,
      lightColor: NEON_PM25_COLORS.lightMode.moderate,
      textDark: 'text-yellow-400',
      textLight: 'text-yellow-700'
    },
    { 
      value: 35.5, 
      label: 'Unhealthy for Sensitive Groups',
      darkColor: NEON_PM25_COLORS.darkMode.usg,
      lightColor: NEON_PM25_COLORS.lightMode.usg,
      textDark: 'text-orange-400',
      textLight: 'text-orange-700'
    },
    { 
      value: 55.5, 
      label: 'Unhealthy',
      darkColor: NEON_PM25_COLORS.darkMode.unhealthy,
      lightColor: NEON_PM25_COLORS.lightMode.unhealthy,
      textDark: 'text-rose-400',
      textLight: 'text-rose-700'
    },
    { 
      value: 150.5, 
      label: 'Very Unhealthy',
      darkColor: NEON_PM25_COLORS.darkMode.veryUnhealthy,
      lightColor: NEON_PM25_COLORS.lightMode.veryUnhealthy,
      textDark: 'text-purple-400',
      textLight: 'text-purple-700'
    },
    { 
      value: 250.5, 
      label: 'Hazardous',
      darkColor: NEON_PM25_COLORS.darkMode.hazardous,
      lightColor: NEON_PM25_COLORS.lightMode.hazardous,
      textDark: 'text-fuchsia-400',
      textLight: 'text-rose-900'
    }
  ];