import React from 'react';
import { Check } from 'lucide-react';
import DrawingAnimation from './controls/AnimatedDrawingExample';
import { canCompletePolygon } from './drawing/DrawingInstructions';

const DrawingHelperOverlay = ({ drawingMode, tempPolygon, isDarkMode, finishDrawing }) => {
  if (!drawingMode) return null;

  const getStageInfo = () => {
    if (tempPolygon.length === 0) {
      return {
        instruction: "Click anywhere on the map to start drawing"
      };
    } else if (tempPolygon.length < 3) {
      return {
        instruction: `Add ${3 - tempPolygon.length} more point${tempPolygon.length === 2 ? '' : 's'} to form a shape`
      };
    } else {
      return {
        instruction: "Add more points or double-click to finish"
      };
    }
  };
  
  const stageInfo = getStageInfo();
  const showCompletionButton = canCompletePolygon(tempPolygon);

  return (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[60] py-2 px-3 rounded-lg backdrop-blur-md shadow-lg max-w-md ${
      isDarkMode 
        ? 'bg-gray-900/90 border border-purple-500 text-white'
        : 'bg-white/90 border border-purple-500 text-gray-800'
    }`}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full">
          <div className="w-16 h-12 flex-shrink-0 bg-blue-100/50 rounded">
            <DrawingAnimation isDarkMode={isDarkMode} />
          </div>
          
          <div className="flex-1">
            <div className="text-sm font-medium">
              {stageInfo.instruction}
            </div>
            
            <div className="text-xs text-gray-500">
              Points added: <span className="font-medium">{tempPolygon.length}</span>
            </div>
          </div>
          
          {showCompletionButton && (
            <button
              onClick={finishDrawing}
              className={`h-8 px-2 rounded flex items-center gap-1 transition-colors text-xs ${
                isDarkMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              <Check className="w-3 h-3" />
              <span className="font-medium">Finish</span>
            </button>
          )}
        </div>
        
        {showCompletionButton && (
          <div className={`w-full flex items-center ${
            isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'
          } rounded py-1 px-2 text-xs`}>
            <span className="font-medium">Double-click to finish the shape</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawingHelperOverlay;