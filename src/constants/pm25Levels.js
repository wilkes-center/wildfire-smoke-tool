export const PM25_LEVELS = [
    { 
      value: 0, 
      label: 'Good',
      maxValue: 12.0,
      color: '#00e400',  // Light mode color
      darkColor: '#00ff9d',  // Dark mode color
      bgColor: 'bg-green-500',
      textColor: 'text-green-700',
      textDark: 'text-emerald-400',
      textLight: 'text-emerald-700',
      position: 0  // For slider positioning
    },
    { 
      value: 12.1, 
      label: 'Moderate',
      maxValue: 35.4,
      color: '#ffff00', 
      darkColor: '#fff700',
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      textDark: 'text-yellow-400',
      textLight: 'text-yellow-700',
      position: 16.67
    },
    { 
      value: 35.5, 
      label: 'Unhealthy for Sensitive Groups',
      shortLabel: 'USG',
      maxValue: 55.4,
      color: '#ff7e00',
      darkColor: '#ff9100',
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-700',
      textDark: 'text-orange-400',
      textLight: 'text-orange-700',
      position: 33.33
    },
    { 
      value: 55.5, 
      label: 'Unhealthy',
      maxValue: 150.4,
      color: '#ff0000',
      darkColor: '#ff0055',
      bgColor: 'bg-red-500',
      textColor: 'text-red-700',
      textDark: 'text-rose-400',
      textLight: 'text-rose-700',
      position: 50
    },
    { 
      value: 150.5, 
      label: 'Very Unhealthy',
      maxValue: 250.4,
      color: '#8f3f97',
      darkColor: '#bf00ff',
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-700',
      textDark: 'text-purple-400',
      textLight: 'text-purple-700',
      position: 66.67
    },
    { 
      value: 250.5, 
      label: 'Hazardous',
      maxValue: 500,
      color: '#7e0023',
      darkColor: '#ff00ff',
      bgColor: 'bg-rose-500',
      textColor: 'text-rose-700',
      textDark: 'text-fuchsia-400',
      textLight: 'text-rose-900',
      position: 83.33
    },
    { 
      value: 500, 
      label: 'Hazardous',
      maxValue: Infinity,
      color: '#7e0023',
      darkColor: '#ff00ff',
      bgColor: 'bg-rose-500',
      textColor: 'text-rose-700',
      textDark: 'text-fuchsia-400',
      textLight: 'text-rose-900',
      position: 100
    }
  ];
  
  export const getPM25Level = (value) => {
    return PM25_LEVELS.find((level, index) => {
      const nextLevel = PM25_LEVELS[index + 1];
      return value >= level.value && (!nextLevel || value < nextLevel.value);
    });
  };
  
  export const getPM25ColorInterpolation = (isDarkMode) => [
    'interpolate',
    ['linear'],
    ['coalesce', ['to-number', ['get', 'PM25'], 0], 0],
    ...PM25_LEVELS.flatMap(level => [
      level.value, 
      isDarkMode ? level.darkColor : level.color
    ])
  ];