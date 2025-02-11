import React from 'react';
import { Minimize2 } from 'lucide-react';

const ThemedPanel = ({
  title,
  subtitle,
  headerActions,
  isExpanded,
  onClose,
  children,
  icon: Icon,
  className = '',
  isDarkMode,
  order = 0
}) => {
  if (isExpanded) {
    return (
      <div className={`w-[480px] rounded-xl shadow-xl overflow-hidden border-2 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-purple-500' 
          : 'bg-white/95 border-purple-500'
      } ${className} backdrop-blur-md`}>
        <div className="w-full h-full flex flex-col">
          {/* Enhanced Header with purple border */}
          <div className={`px-4 py-3 border-b-2 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500' 
              : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className={`p-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h2 className={`text-lg font-semibold leading-none ${
                    isDarkMode ? 'text-purple-100' : 'text-purple-900'
                  }`}>
                    {title}
                  </h2>
                  {subtitle && (
                    <div className={`text-sm mt-1 ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`}>
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {headerActions}
                <button
                  onClick={onClose}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-purple-500/10 text-purple-400 hover:text-purple-300'
                      : 'hover:bg-purple-100 text-purple-500 hover:text-purple-600'
                  }`}
                  title="Minimize"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Content Area */}
          <div className={`flex-1 overflow-hidden ${
            isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'
          }`}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Minimized state with enhanced styling
  return (
    <button
      onClick={onClose}
      className={`rounded-xl shadow-lg transition-all duration-300 w-12 h-12 flex items-center justify-center backdrop-blur-md
        ${isDarkMode 
          ? 'bg-gray-900/90 hover:bg-gray-800/90 hover:shadow-purple-500/20 hover:shadow-lg border-2 border-purple-500' 
          : 'bg-white/90 hover:bg-gray-50/90 hover:shadow-purple-500/10 hover:shadow-lg border-2 border-purple-500'
        } transform hover:scale-105`}
    >
      <Icon className={`w-5 h-5 ${
        isDarkMode ? 'text-purple-400' : 'text-purple-600'
      }`} />
    </button>
  );
};

// Parent container for minimized buttons with enhanced spacing
export const MinimizedContainer = ({ children, isDarkMode }) => (
  <div className="fixed top-20 right-4 z-50 flex flex-col gap-3">
    {children}
  </div>
);

export default ThemedPanel;