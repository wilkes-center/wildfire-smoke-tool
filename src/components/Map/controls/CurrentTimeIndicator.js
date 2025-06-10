import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { getCurrentTimelineHour } from '../../../utils/map/timeUtils';
import { START_DATE, TOTAL_HOURS } from '../../../utils/map/constants';

/**
 * Shows a subtle indicator when the app starts at current time
 */
export const CurrentTimeIndicator = ({ currentHour, isDarkMode }) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const [isAtCurrentTime, setIsAtCurrentTime] = useState(false);

  useEffect(() => {
    // Check if we're at the current time
    const currentTimelineHour = getCurrentTimelineHour(START_DATE, TOTAL_HOURS);
    const atCurrentTime = Math.abs(currentHour - currentTimelineHour) <= 1; // Allow 1 hour tolerance
    
    setIsAtCurrentTime(atCurrentTime);
    
    // Show indicator briefly when at current time (either on load or when navigating to current time)
    if (atCurrentTime) {
      setShowIndicator(true);
      const timer = setTimeout(() => setShowIndicator(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowIndicator(false);
    }
  }, [currentHour]);

  if (!showIndicator && !isAtCurrentTime) return null;

  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all duration-300 ${
      showIndicator 
        ? 'opacity-100 transform translate-y-0' 
        : isAtCurrentTime 
          ? 'opacity-70 transform translate-y-0' 
          : 'opacity-0 transform -translate-y-2'
    } ${
      isDarkMode 
        ? 'bg-green-900/20 text-green-300 border border-green-700/30' 
        : 'bg-green-50 text-green-700 border border-green-200'
    }`}>
      {showIndicator ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Started at current time</span>
        </>
      ) : (
        <>
          <Clock className="w-4 h-4" />
          <span>Current time</span>
        </>
      )}
    </div>
  );
};

export default CurrentTimeIndicator; 