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
      <div
        className={`w-[clamp(20rem,30vw,35rem)] rounded-xl shadow-xl overflow-hidden border-2 ${
          isDarkMode ? 'bg-gray-900/95 border-white' : 'bg-white/95 border-mahogany'
        } ${className} backdrop-blur-md`}
      >
        <div className="w-full h-full flex flex-col">
          <div
            className={`px-4 py-3 border-b-2 ${
              isDarkMode
                ? 'bg-gradient-to-r from-forest-dark/30 to-sage-dark/30 border-white'
                : 'bg-gradient-to-r from-cream to-sage-light/30 border-mahogany'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div
                    className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-forest/10 text-white' : 'bg-sage-light text-forest'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h2
                    className={`text-lg font-semibold leading-none ${
                      isDarkMode ? 'text-white' : 'text-forest'
                    }`}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <div
                      className={`text-sm mt-1 ${
                        isDarkMode ? 'text-white/80' : 'text-forest-light'
                      }`}
                    >
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
                      ? 'hover:bg-forest/10 text-white hover:text-white'
                      : 'hover:bg-sage-light text-forest hover:text-forest-dark'
                  }`}
                  title="Minimize"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'}`}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Minimized state
  return (
    <button
      onClick={onClose}
      className={`rounded-xl shadow-lg transition-all duration-300 w-12 h-12 flex items-center justify-center backdrop-blur-md
        ${
          isDarkMode
            ? 'bg-gray-900/90 hover:bg-gray-800/90 hover:shadow-white/20 hover:shadow-lg border-2 border-white'
            : 'bg-white/90 hover:bg-gray-50/90 hover:shadow-mahogany/10 hover:shadow-lg border-2 border-mahogany'
        } transform hover:scale-105`}
    >
      <Icon className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-forest'}`} />
    </button>
  );
};

// Container for minimized buttons with proper spacing
export const MinimizedContainer = ({ children, isDarkMode }) => (
  <div className="fixed top-20 right-4 z-50 flex flex-col gap-3">{children}</div>
);

export default ThemedPanel;
