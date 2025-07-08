import React from 'react';

import { Info, Wind } from 'lucide-react';

const PM25Section = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-forest text-white p-6">
        <div className="flex items-center gap-3">
          <Wind className="w-8 h-8" />
          <h3 className="text-2xl font-bold">
            Understanding PM<sub>2.5</sub>
          </h3>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          PM<sub>2.5</sub> refers to fine particulate matter with a diameter of 2.5 micrometers or
          smaller. These microscopic particles can penetrate deep into your lungs and even enter
          your bloodstream, posing significant health risks, especially to vulnerable populations.
        </p>

        {/* PM2.5 Level Chart */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-forest mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            PM<sub>2.5</sub> Levels and Health Impact
          </h4>

          {/* Gradient bar with levels */}
          <div className="relative mt-6 mb-12">
            <div className="h-10 w-full rounded-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-green-500 via-yellow-400 via-orange-400 via-red-500 via-purple-600 to-rose-800"></div>
            </div>

            {/* Markers and labels */}
            <div className="absolute top-full left-0 w-full flex justify-between text-sm mt-2">
              <div className="text-center -ml-2">
                <div className="font-medium" style={{ color: '#00d600' }}>
                  Good
                </div>
                <div className="text-xs text-gray-600">0-12 μg/m³</div>
              </div>
              <div className="text-center">
                <div className="font-medium" style={{ color: '#ffee00' }}>
                  Moderate
                </div>
                <div className="text-xs text-gray-600">12.1-35.4</div>
              </div>
              <div className="text-center">
                <div className="font-medium max-w-20 text-center" style={{ color: '#ff8800' }}>
                  USG
                </div>
                <div className="text-xs text-gray-600">35.5-55.4</div>
              </div>
              <div className="text-center">
                <div className="font-medium" style={{ color: '#ff1a1a' }}>
                  Unhealthy
                </div>
                <div className="text-xs text-gray-600">55.5-150.4</div>
              </div>
              <div className="text-center">
                <div className="font-medium" style={{ color: '#9933ff' }}>
                  Very Unhealthy
                </div>
                <div className="text-xs text-gray-600">150.5-250.4</div>
              </div>
              <div className="text-center -mr-2">
                <div className="font-medium" style={{ color: '#990033' }}>
                  Hazardous
                </div>
                <div className="text-xs text-gray-600">250.5+</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-8 text-xs text-gray-500 italic">
          Note: USG stands for "Unhealthy for Sensitive Groups" - including children, older adults,
          and people with respiratory or heart conditions.
        </div>
      </div>
    </div>
  );
};

export default PM25Section;
