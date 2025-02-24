import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Info, MapPin, Clock, Wind, Sun, PenLine } from 'lucide-react';

const IntroTour = ({ onComplete, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [previousElement, setPreviousElement] = useState(null);
  const cleanupFunctionRef = useRef(null);

  const tourSteps = [
    {
      title: "Welcome to the Air Quality Visualizer",
      description: "This interactive map shows PM2.5 air quality data across the United States. We'll walk you through the main features to help you get started.",
      target: null,
      icon: MapPin
    },
    {
      title: "Time Controls",
      description: "Use these controls to play through time, change the playback speed, or jump to a specific time. This lets you see how air quality changes over multiple days.",
      target: "time-controls",
      position: "top",
      icon: Clock
    },
    {
      title: "PM2.5 Threshold",
      description: "Adjust this slider to filter air quality data. Only areas with PM2.5 levels above this threshold will be visible. Higher values show only the most affected areas.",
      target: "pm25-threshold",
      position: "bottom",
      icon: Wind
    },
    {
      title: "Date and Time",
      description: "Shows the current date and time being displayed on the map. The data updates hourly with the latest air quality measurements.",
      target: "date-time",
      position: "bottom",
      icon: Clock
    },
    {
      title: "Theme Controls",
      description: "Toggle between light and dark mode, or choose different map styles to customize your viewing experience.",
      target: "theme-controls",
      position: "bottom",
      icon: Sun
    },
    {
      title: "Draw Area",
      description: "Click to draw a custom area on the map. You can analyze population and air quality statistics within this region to see how many people are affected.",
      target: "draw-button",
      position: "bottom",
      icon: PenLine
    },
    {
      title: "Zoom Controls",
      description: "Zoom in and out of the map, or reset to the default view. Zooming in reveals more detailed air quality patterns in specific regions.",
      target: "zoom-controls",
      position: "right",
      icon: MapPin
    }
  ];

  // Handle next/previous/skip with proper cleanup
  const handleNext = () => {
    // Clean up any highlighting before moving to next step
    if (cleanupFunctionRef.current) {
      try {
        cleanupFunctionRef.current();
      } catch (err) {
        console.error("Error cleaning up in handleNext:", err);
      }
      cleanupFunctionRef.current = null;
    }
    
    // Also manually clean up the current highlighted element
    if (highlightedElement && document.body.contains(highlightedElement)) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.outline = '';
      highlightedElement.style.outlineOffset = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.transform = '';
      highlightedElement.style.transition = '';
    }
    
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // If this is the last step, perform a final thorough cleanup
      performFinalCleanup();
      setIsVisible(false);
      if (onComplete) onComplete();
    }
  };

  const handlePrevious = () => {
    // Clean up any highlighting before moving to previous step
    if (cleanupFunctionRef.current) {
      try {
        cleanupFunctionRef.current();
      } catch (err) {
        console.error("Error cleaning up in handlePrevious:", err);
      }
      cleanupFunctionRef.current = null;
    }
    
    // Also manually clean up the current highlighted element
    if (highlightedElement && document.body.contains(highlightedElement)) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.outline = '';
      highlightedElement.style.outlineOffset = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.transform = '';
      highlightedElement.style.transition = '';
    }
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Clean up any highlighting before skipping
    if (cleanupFunctionRef.current) {
      try {
        cleanupFunctionRef.current();
      } catch (err) {
        console.error("Error cleaning up in handleSkip:", err);
      }
      cleanupFunctionRef.current = null;
    }
    
    // Also manually clean up the current highlighted element
    if (highlightedElement && document.body.contains(highlightedElement)) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.outline = '';
      highlightedElement.style.outlineOffset = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.transform = '';
      highlightedElement.style.transition = '';
    }
    
    // Perform a thorough cleanup of any element that might have purple outlines
    performFinalCleanup();
    
    setIsVisible(false);
    if (onComplete) onComplete();
  };
  
  // Function to thoroughly clean up all highlighting when tour is complete
  const performFinalCleanup = useCallback(() => {
    console.log("Performing final cleanup of all tour highlights");
    
    // Find any element with purple outline styling and clean it
    const purpleOutlineElements = document.querySelectorAll('[style*="outline"]');
    purpleOutlineElements.forEach(el => {
      try {
        const styleValue = el.getAttribute('style') || '';
        if (styleValue.includes('purple') || 
            styleValue.includes('#a855f7') || 
            styleValue.includes('#8b5cf6') ||
            styleValue.includes('#d8b4fe') ||
            styleValue.includes('#c4b5fd')) {
          
          console.log("Cleaning element with purple outline:", el);
          el.style.position = '';
          el.style.zIndex = '';
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.style.boxShadow = '';
          el.style.transform = '';
          el.style.transition = '';
        }
      } catch (err) {
        console.error("Error cleaning element:", err);
      }
    });
    
    // Also check for elements with box-shadow or scale transform
    const boxShadowElements = document.querySelectorAll('[style*="box-shadow"]');
    boxShadowElements.forEach(el => {
      try {
        el.style.boxShadow = '';
      } catch (err) {
        console.error("Error removing box-shadow:", err);
      }
    });
    
    const transformElements = document.querySelectorAll('[style*="scale"]');
    transformElements.forEach(el => {
      try {
        el.style.transform = '';
      } catch (err) {
        console.error("Error removing transform:", err);
      }
    });
  }, []);

  // Helper function to find elements by different strategies
  const findElementByMultipleSelectors = useCallback((targetId) => {
    // Try different selector strategies in order of preference
    const selectors = [
      `[data-tour="${targetId}"]`,                  // 1. Exact data-tour attribute
      `[class*="${targetId}"]`,                     // 2. Class contains target name
      `[class*="${targetId.replace(/-/g, "")}"]`,   // 3. Class with no hyphens
      `[title*="${targetId.replace(/-/g, " ")}"]`   // 4. Title attribute contains words
    ];
    
    // For specific cases - more specific selectors for each component
    if (targetId === 'time-controls') {
      selectors.push(
        '.TimeControls', 
        '[class*="TimeControls"]',
        '.fixed.bottom-4.left-1\\/2.-translate-x-1\\/2',
        '.fixed.bottom-4 [class*="rounded-lg"]'
      );
    } else if (targetId === 'pm25-threshold') {
      selectors.push(
        '[class*="PM25ThresholdSlider"]', 
        '[class*="PM25"]',
        '.top-4.left-1\\/2.-translate-x-1\\/2 [class*="rounded-xl"]',
        '.fixed.top-4 .flex.items-center.gap-4 > :first-child'
      );
    } else if (targetId === 'date-time') {
      selectors.push(
        '[class*="DateTime"]',
        '.top-4.left-1\\/2.-translate-x-1\\/2 [class*="rounded-lg"]',
        '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(2)'
      );
    } else if (targetId === 'theme-controls') {
      selectors.push(
        '[class*="ThemeControls"]',
        '.flex.items-center.gap-2',
        '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(3)'
      );
    } else if (targetId === 'draw-button') {
      selectors.push(
        '[title="Draw Area"]', 
        'button[title*="Draw"]',
        'button[class*="w-10 h-10 rounded-lg"]',
        '.fixed.top-4 .flex.items-center.gap-4 > :nth-child(3) > :nth-child(2)'
      );
    } else if (targetId === 'zoom-controls') {
      selectors.push(
        '[class*="ZoomControls"]',
        '.fixed.left-4.bottom-4',
        '.fixed.left-4.bottom-4 > div'
      );
    }
    
    // Try each selector
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          console.log(`Found element for ${targetId} using selector: ${selector}`);
          return element;
        }
      } catch (err) {
        console.warn(`Error with selector ${selector}:`, err);
      }
    }
    
    // Fallback - try to find by approximate location on screen
    try {
      if (targetId === 'time-controls') {
        const bottomElements = Array.from(document.querySelectorAll('.fixed.bottom-4 *'));
        const largestElement = bottomElements.sort((a, b) => 
          (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight)
        )[0];
        if (largestElement) return largestElement;
      } else if (targetId === 'zoom-controls') {
        const leftElements = Array.from(document.querySelectorAll('.fixed.left-4 *'));
        const largestElement = leftElements.sort((a, b) => 
          (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight)
        )[0];
        if (largestElement) return largestElement;
      }
    } catch (err) {
      console.warn('Error in fallback element finding:', err);
    }
    
    console.warn(`Could not find element for ${targetId}`);
    return null;
  }, []);

  // Remove highlight from previous element when changing steps
  useEffect(() => {
    // First ensure any previous highlighting is completely removed
    if (cleanupFunctionRef.current) {
      try {
        console.log("Executing cleanup function for previous element");
        cleanupFunctionRef.current();
      } catch (err) {
        console.error("Error during cleanup:", err);
      }
      cleanupFunctionRef.current = null;
    }
    
    // Also directly clear styles from previous element as a backup method
    if (previousElement && document.body.contains(previousElement)) {
      console.log("Manually cleaning up previous element");
      previousElement.style.position = '';
      previousElement.style.zIndex = '';
      previousElement.style.outline = '';
      previousElement.style.outlineOffset = '';
      previousElement.style.boxShadow = '';
      previousElement.style.transform = '';
      previousElement.style.transition = '';
      void previousElement.offsetHeight; // Force repaint
    }
    
    // Add a small delay to ensure the UI has rendered
    const timeoutId = setTimeout(() => {
      const step = tourSteps[currentStep];
      if (step.target) {
        const element = findElementByMultipleSelectors(step.target);
        
        // Add better debug information
        if (element) {
          console.log(`Found element for ${step.target}:`, element);
          setPreviousElement(element);
        } else {
          console.warn(`Could not find element for ${step.target}`);
          setPreviousElement(null);
        }
        
        setHighlightedElement(element);
      } else {
        setHighlightedElement(null);
        setPreviousElement(null);
      }
    }, 20); 
    
    return () => clearTimeout(timeoutId);
  }, [currentStep, tourSteps, findElementByMultipleSelectors, previousElement]);

  // Handle component unmounting - make sure to clean up any highlighting
  useEffect(() => {
    // Add a global cleanup function to the window to ensure we can clean up
    // from anywhere in case the normal cleanup fails
    window.cleanUpTourHighlights = () => {
      // Perform the thorough cleanup
      performFinalCleanup();
      
      // Try to clean up using the ref
      if (cleanupFunctionRef.current) {
        try {
          cleanupFunctionRef.current();
        } catch (err) {
          console.error("Error in global cleanup:", err);
        }
        cleanupFunctionRef.current = null;
      }
    };
    
    return () => {
      // Call our global cleanup function
      if (window.cleanUpTourHighlights) {
        window.cleanUpTourHighlights();
      }
      
      // Remove the global function
      delete window.cleanUpTourHighlights;
    };
  }, [performFinalCleanup]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with click-through for map interaction */}
      <div 
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Main intro panel - shown only for first step */}
      {currentStep === 0 && (
        <div 
          className={`relative w-[500px] rounded-xl shadow-xl overflow-hidden ${
            isDarkMode 
              ? 'bg-gray-900 border-2 border-purple-500' 
              : 'bg-white border-2 border-purple-500'
          } pointer-events-auto`}
        >
          <div className={`px-6 py-4 border-b ${
            isDarkMode 
              ? 'border-gray-700' 
              : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-600'
                }`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {tourSteps[currentStep].title}
                </h2>
              </div>
              <button 
                onClick={handleSkip}
                className={`p-1 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="px-6 py-6">
            <p className={`text-base ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {tourSteps[currentStep].description}
            </p>
            
            <div className="mt-4 flex gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-blue-500 shrink-0 mt-1">
                <Info className="w-5 h-5" />
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                You can access this tour again at any time by clicking the help button in the bottom right corner of the screen.
              </p>
            </div>
          </div>
          
          <div className={`px-6 py-4 border-t flex justify-between ${
            isDarkMode 
              ? 'border-gray-700' 
              : 'border-gray-200'
          }`}>
            <button
              onClick={handleSkip}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              Skip tour
            </button>
            
            <button
              onClick={handleNext}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isDarkMode 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Feature tooltip - shown for steps after the first */}
      {currentStep > 0 && (
        <FeatureTooltip 
          step={tourSteps[currentStep]}
          element={highlightedElement}
          isDarkMode={isDarkMode}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSkip={handleSkip}
          isLastStep={currentStep === tourSteps.length - 1}
          stepNumber={currentStep}
          totalSteps={tourSteps.length - 1}
          cleanupFunctionRef={cleanupFunctionRef}
        />
      )}
    </div>
  );
};

// Component for positioning tooltips near UI elements
const FeatureTooltip = ({ 
  step, 
  element, 
  isDarkMode, 
  onPrevious, 
  onNext, 
  onSkip,
  isLastStep,
  stepNumber,
  totalSteps,
  cleanupFunctionRef
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  // Default positions for each step if element isn't found
  const getDefaultPosition = (stepTarget) => {
    switch(stepTarget) {
      case 'time-controls':
        return { top: window.innerHeight - 150, left: window.innerWidth / 2 - 150 };
      case 'pm25-threshold':
        return { top: 100, left: window.innerWidth / 2 - 150 };
      case 'date-time':
        return { top: 100, left: window.innerWidth / 2 };
      case 'theme-controls':
        return { top: 100, left: window.innerWidth / 2 + 150 };
      case 'draw-button':
        return { top: 100, left: window.innerWidth / 2 + 250 };
      case 'zoom-controls':
        return { top: window.innerHeight / 2, left: 100 };
      default:
        return { top: window.innerHeight / 2, left: window.innerWidth / 2 };
    }
  };

  useEffect(() => {
    // Helper for finding the position
    const updatePosition = () => {
      // Clean up previous highlight if we're switching elements
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current();
        cleanupFunctionRef.current = null;
      }
      
      // If we have the element, position next to it
      if (element) {
        try {
          const rect = element.getBoundingClientRect();
          const tooltipWidth = 300;
          const tooltipHeight = 180;
          
          let top, left;
          
          switch(step.position) {
            case 'top':
              top = rect.top - tooltipHeight - 10;
              left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
              break;
            case 'bottom':
              top = rect.bottom + 10;
              left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
              break;
            case 'left':
              top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
              left = rect.left - tooltipWidth - 10;
              break;
            case 'right':
              top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
              left = rect.right + 10;
              break;
            default:
              top = rect.bottom + 10;
              left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          }
          
          // Keep tooltip on screen
          if (left < 10) left = 10;
          if (left + tooltipWidth > window.innerWidth - 10) {
            left = window.innerWidth - tooltipWidth - 10;
          }
          if (top < 10) top = 10;
          if (top + tooltipHeight > window.innerHeight - 10) {
            top = window.innerHeight - tooltipHeight - 10;
          }
          
          setPosition({ top, left });
          
          // Store original styles to restore them later
          const originalStyles = {
            position: element.style.position,
            zIndex: element.style.zIndex,
            outline: element.style.outline,
            outlineOffset: element.style.outlineOffset,
            boxShadow: element.style.boxShadow,
            transform: element.style.transform,
            transition: element.style.transition
          };
          
          // Enhanced element highlighting - apply both outline and a pseudo-element highlight
          element.style.position = element.style.position === 'static' ? 'relative' : element.style.position;
          element.style.zIndex = '1050';
          element.style.outline = `2px solid ${isDarkMode ? '#a855f7' : '#8b5cf6'}`;
          element.style.outlineOffset = '4px';
          element.style.boxShadow = `0 0 0 4px ${isDarkMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`;
          element.style.transition = 'outline 0.2s, box-shadow 0.2s, transform 0.2s';
          element.style.transform = 'scale(1.02)';
          
          // Add a subtle animation to draw attention
          const pulseAnimation = () => {
            element.style.outline = `2px solid ${isDarkMode ? '#d8b4fe' : '#c4b5fd'}`;
            element.style.boxShadow = `0 0 0 6px ${isDarkMode ? 'rgba(168, 85, 247, 0.15)' : 'rgba(139, 92, 246, 0.15)'}`;
            
            setTimeout(() => {
              if (element) { // Check if element still exists
                element.style.outline = `2px solid ${isDarkMode ? '#a855f7' : '#8b5cf6'}`;
                element.style.boxShadow = `0 0 0 4px ${isDarkMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`;
              }
            }, 700);
          };
          
          // Start pulsing
          pulseAnimation();
          const pulseInterval = setInterval(pulseAnimation, 1500);
          
          // Create cleanup function and store it in the ref
          const cleanup = () => {
            // Clear interval first
            clearInterval(pulseInterval);
            
            // Check if element still exists in DOM before trying to modify it
            if (element && document.body.contains(element)) {
              console.log("Cleaning up element styles:", element);
              // Completely remove the styles instead of trying to restore them
              element.style.position = '';
              element.style.zIndex = '';
              element.style.outline = '';
              element.style.outlineOffset = '';
              element.style.boxShadow = '';
              element.style.transform = '';
              element.style.transition = '';
              
              // Force a repaint to ensure styles are cleared
              void element.offsetHeight;
            }
          };
          
          // Store cleanup function in ref so it can be accessed from outside
          cleanupFunctionRef.current = cleanup;
          
          return cleanup;
        } catch (error) {
          console.warn("Error positioning tooltip:", error);
        }
      } 
      
      // If no element, use default positions
      const defaultPos = getDefaultPosition(step.target);
      setPosition(defaultPos);
      return () => {};
    };
    
    // Update position immediately and on resize
    const cleanup = updatePosition();
    window.addEventListener('resize', updatePosition);
    
    // Make sure we clean up when component unmounts
    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('resize', updatePosition);
    };
  }, [element, step.position, step.target, isDarkMode, cleanupFunctionRef]);

  return (
    <div 
      className={`absolute w-[300px] rounded-lg shadow-lg pointer-events-auto ${
        isDarkMode 
          ? 'bg-gray-900 border border-purple-500' 
          : 'bg-white border border-purple-500'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className={`p-1.5 rounded-lg ${
          isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
        }`}>
          {step.icon ? React.createElement(step.icon, { className: "w-4 h-4" }) : <Info className="w-4 h-4" />}
        </div>
        <h3 className={`text-sm font-medium ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          {step.title}
        </h3>
        <div className={`ml-auto px-2 py-0.5 rounded text-xs ${
          isDarkMode ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-100 text-purple-700'
        }`}>
          Step {stepNumber} of {totalSteps}
        </div>
      </div>
      
      <div className="px-4 py-3">
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {step.description}
        </p>
      </div>
      
      <div className={`px-4 py-3 border-t flex justify-between ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            className={`p-1.5 rounded-lg ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={onSkip}
            className={`text-xs px-2 py-1 rounded ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            Skip
          </button>
        </div>
        
        <button
          onClick={onNext}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm ${
            isDarkMode 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          {isLastStep ? 'Finish' : 'Next'}
          {!isLastStep && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default IntroTour;