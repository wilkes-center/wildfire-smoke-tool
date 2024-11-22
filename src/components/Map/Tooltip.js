import React, { useState } from 'react';

const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900/90 rounded shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200';
    
    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
      left: 'right-full top-1/2 -translate-y-1/2 mr-1',
      right: 'left-full top-1/2 -translate-y-1/2 ml-1'
    };

    return `${baseClasses} ${positionClasses[position]}`;
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {isVisible && (
        <div className={getTooltipClasses()}>
          {content}
        </div>
      )}
      {children}
    </div>
  );
};

export default Tooltip;