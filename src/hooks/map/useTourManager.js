import { useCallback, useEffect } from 'react';

export const useTourManager = ({ showTour, setShowTour, mapInstance, isMapLoaded }) => {
  const handleTourComplete = useCallback(() => {
    setShowTour(false);
    localStorage.setItem('tourCompleted', 'true');
  }, [setShowTour]);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('tourCompleted');
    if (tourCompleted === 'true') {
      setShowTour(false);
    }
  }, [setShowTour]);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;

    const addTourAttributes = () => {
      const tourElements = [
        {
          selector: '.fixed.bottom-4.left-1\\/2.-translate-x-1\\/2',
          id: 'tour-time-controls',
          attr: 'time-controls'
        },
        {
          selector: '.fixed.top-4 .flex.items-center.gap-4 > :first-child',
          id: 'tour-pm25-threshold',
          attr: 'pm25-threshold'
        },
        {
          selector: '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(2)',
          id: 'tour-date-time',
          attr: 'date-time'
        },
        {
          selector: '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(3)',
          id: 'tour-theme-controls',
          attr: 'theme-controls'
        },
        {
          selector: '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(3) button',
          id: 'tour-draw-button',
          attr: 'draw-button'
        },
        { selector: '.fixed.left-4.bottom-4', id: 'tour-zoom-controls', attr: 'zoom-controls' }
      ];

      let foundCount = 0;
      tourElements.forEach(item => {
        const element = document.querySelector(item.selector);
        if (element) {
          element.id = item.id;
          element.setAttribute('data-tour', item.attr);
          foundCount++;
        }
      });

      if (foundCount < tourElements.length) {
        setTimeout(addTourAttributes, 1000);
      }
    };

    setTimeout(addTourAttributes, 1000);
  }, [mapInstance, isMapLoaded]);

  return { handleTourComplete };
};
