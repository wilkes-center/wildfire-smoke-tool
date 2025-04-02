import React, { useState } from 'react';

/**
 * Base Tooltip Component - used by various tooltip implementations
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The element that triggers the tooltip
 * @param {React.ReactNode} props.content - The content to display in the tooltip
 * @param {string} props.position - Position of tooltip (top, bottom, left, right)
 * @param {string} props.className - Additional CSS classes for the tooltip
 * @returns {React.ReactElement}
 */
const TooltipBase = ({ 
  children, 
  content, 
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-green/95 rounded shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200 font-redhat';
    
    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
      left: 'right-full top-1/2 -translate-y-1/2 mr-1',
      right: 'left-full top-1/2 -translate-y-1/2 ml-1'
    };

    return `${baseClasses} ${positionClasses[position]} ${className}`;
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

export default TooltipBase;