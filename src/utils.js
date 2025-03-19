export const formatLayerName = (name) => {
    return name
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/Ssp/g, 'SSP')
      .replace(/Km/g, 'km');
  };