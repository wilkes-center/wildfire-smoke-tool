import React from 'react';
import { Users2 } from 'lucide-react';

const ContentPanel = ({ isDarkMode, children, title, subtitle }) => {
  return (
    <div className="w-80">
      <div className={`backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 border-2 border-forest ${
        isDarkMode ? 'bg-gray-900/95 text-gray-200' : 'bg-white/95 text-gray-800'
      }`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-gold" />
            <div>
              <div className={`text-sm font-medium ${
                isDarkMode ? 'text-sage' : 'text-forest-light'
              }`}>{title}</div>
              {subtitle && (
                <div className={`text-xl font-semibold ${
                  isDarkMode ? 'text-gold-light' : 'text-forest'
                }`}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ContentPanel;