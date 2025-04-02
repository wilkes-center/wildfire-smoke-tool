import { useState } from 'react';

export const useUIState = () => {
  const [showTour, setShowTour] = useState(false);
  const [censusLoading, setCensusLoading] = useState(false);
  const [censusError, setCensusError] = useState(null);

  return {
    showTour,
    setShowTour,
    censusLoading,
    setCensusLoading,
    censusError,
    setCensusError
  };
};
