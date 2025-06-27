import React, { useState } from 'react';

import { Github, HelpCircle, Info, MapPin, MessageSquare, Play, X } from 'lucide-react';
// import StoryMapsDemo from './StoryMapsDemo';

const IntroPage = ({ onComplete }) => {
  const [activeSection, setActiveSection] = useState('about');
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Handle opening demo modal
  const handleOpenDemo = () => {
    setShowDemoModal(true);
  };

  // Handle closing demo modal
  const handleCloseDemo = () => {
    setShowDemoModal(false);
  };

  // Handle launching the StoryMaps demo - DISABLED
  // const handleLaunchDemo = () => {
  //   setActiveSection('demo');
  // };

  // Handle launching the full tool from demo - DISABLED
  // const handleLaunchTool = () => {
  //   onComplete();
  // };

  // Handle returning from demo to intro - DISABLED
  // const handleBackFromDemo = () => {
  //   setActiveSection('about');
  // };

  // If demo is active, show full-screen StoryMaps - DISABLED
  // if (activeSection === 'demo') {
  //   return <StoryMapsDemo onLaunchTool={handleLaunchTool} onBack={handleBackFromDemo} />;
  // }

  return (
    <div className="fixed inset-0 font-sora bg-cream flex flex-col">
      {/* Background gradient accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-sage/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-forest/5 rounded-full blur-3xl transform translate-x-1/4 translate-y-1/4"></div>
      </div>

      {/* Main container */}
      <div className="flex-1 w-full p-8 flex flex-col max-h-screen overflow-auto">
        {/* Header with title and tabs */}
        <header className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 flex items-center justify-center">
              <img
                src={`${process.env.PUBLIC_URL}/logo192.png`}
                alt="Wildfire Smoke Tool Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <h1 className="text-5xl font-bold text-obsidian">
              <span className="text-mahogany">Wildfire</span> Smoke Forecast Tool
            </h1>
          </div>

          {/* Enter Map and Demo Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={onComplete}
              className="bg-mahogany hover:bg-mahogany/90 text-white font-bold text-lg py-3 px-10 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Enter Map
            </button>

            <button
              onClick={handleOpenDemo}
              className="bg-sage hover:bg-sage/90 text-forest font-bold text-lg py-3 px-10 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Demo
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-4 p-1 bg-white/50 backdrop-blur-sm rounded-xl shadow-md">
              <button
                onClick={() => setActiveSection('about')}
                className={`py-3 px-8 rounded-lg flex items-center transition-all relative ${
                  activeSection === 'about'
                    ? 'bg-sage/30 text-forest font-semibold shadow-sm'
                    : 'text-forest/70 hover:bg-forest/5'
                }`}
              >
                <Info
                  className={`w-5 h-5 mr-3 ${activeSection === 'about' ? 'text-mahogany' : 'text-forest/60'}`}
                />
                <span>About</span>
                {activeSection === 'about' && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-mahogany rounded-b-lg"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('howto')}
                className={`py-3 px-8 rounded-lg flex items-center transition-all relative ${
                  activeSection === 'howto'
                    ? 'bg-sage/30 text-forest font-semibold shadow-sm'
                    : 'text-forest/70 hover:bg-forest/5'
                }`}
              >
                <HelpCircle
                  className={`w-5 h-5 mr-3 ${activeSection === 'howto' ? 'text-mahogany' : 'text-forest/60'}`}
                />
                <span>How to Use</span>
                {activeSection === 'howto' && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-mahogany rounded-b-lg"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('feedback')}
                className={`py-3 px-8 rounded-lg flex items-center transition-all relative ${
                  activeSection === 'feedback'
                    ? 'bg-sage/30 text-forest font-semibold shadow-sm'
                    : 'text-forest/70 hover:bg-forest/5'
                }`}
              >
                <MessageSquare
                  className={`w-5 h-5 mr-3 ${activeSection === 'feedback' ? 'text-mahogany' : 'text-forest/60'}`}
                />
                <span>Feedback</span>
                {activeSection === 'feedback' && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-mahogany rounded-b-lg"></div>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content container */}
        <div className="flex-1 mb-8">
          {activeSection === 'about' && (
            <div className="flex justify-center">
              {/* About This Tool */}
              <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-4xl w-full">
                <h2 className="text-3xl font-bold text-forest mb-6">About This Tool</h2>
                <div className="h-1 w-20 bg-mahogany mb-6"></div>

                <p className="text-xl text-forest-dark mb-4 font-redhat">
                  This product depicts a smoke forecast for the Western U.S. using the CMAQ chemical
                  transport model, with smoke emissions estimated using version 1 of TraceAQs fire
                  activity parameterization. Smoke forecasts are generated out to 4 days and have a
                  spatial grid spacing of 12-km.
                </p>

                <p className="text-xl text-forest-dark mb-8 font-redhat">
                  This model is supported by the Wilkes Center for Climate Science and Policy,
                  National Science Foundation CIVIC Innovation Program, and the University of Utah's
                  Center for High Performance Computing.
                </p>

                {/* Interactive Demo Button - DISABLED */}
                {/*
                <div className="mt-8 pt-6 border-t border-forest/20">
                  <button
                    onClick={handleLaunchDemo}
                    className="w-full bg-gradient-to-r from-mahogany to-mahogany/80 hover:from-mahogany/90 hover:to-mahogany/70 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center group"
                  >
                    <Presentation className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                    <span className="text-lg">Explore Interactive Demo</span>
                    <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-sm text-forest/70 text-center mt-3 font-redhat">
                    Experience a guided tour of the tool's capabilities
                  </p>
                </div>
                */}
              </div>
            </div>
          )}

          {activeSection === 'howto' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Quick Start Guide */}
              <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg lg:col-span-2">
                <h2 className="text-3xl font-bold text-forest mb-6">Quick Start Guide</h2>
                <div className="h-1 w-20 bg-mahogany mb-6"></div>

                <ol className="space-y-6">
                  <li className="flex">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage text-forest font-bold mr-4 flex-shrink-0">
                      1
                    </span>
                    <div>
                      <h3 className="font-medium text-lg text-forest">Navigate the map</h3>
                      <p className="text-forest-dark font-redhat">
                        Use standard zoom and pan controls located on the left side of the screen.
                      </p>
                    </div>
                  </li>

                  <li className="flex">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage text-forest font-bold mr-4 flex-shrink-0">
                      2
                    </span>
                    <div>
                      <h3 className="font-medium text-lg text-forest">Use the time controls</h3>
                      <p className="text-forest-dark font-redhat">
                        Play through the 4-day timeline or jump to a specific hour using the
                        controls at the bottom.
                      </p>
                    </div>
                  </li>

                  <li className="flex">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage text-forest font-bold mr-4 flex-shrink-0">
                      3
                    </span>
                    <div>
                      <h3 className="font-medium text-lg text-forest">
                        Adjust the PM<sub>2.5</sub> threshold
                      </h3>
                      <p className="text-forest-dark font-redhat">
                        Use the slider in the top-left to filter visible smoke concentrations.
                      </p>
                    </div>
                  </li>

                  <li className="flex">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage text-forest font-bold mr-4 flex-shrink-0">
                      4
                    </span>
                    <div>
                      <h3 className="font-medium text-lg text-forest">Draw custom areas</h3>
                      <p className="text-forest-dark font-redhat">
                        Use the drawing tool to analyze population exposure to different PM<sub>2.5</sub>
                        levels.
                      </p>
                    </div>
                  </li>

                  <li className="flex">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage text-forest font-bold mr-4 flex-shrink-0">
                      5
                    </span>
                    <div>
                      <h3 className="font-medium text-lg text-forest">
                        Toggle light and dark mode
                      </h3>
                      <p className="text-forest-dark font-redhat">
                        Use the theme button for your preferred viewing experience.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Video Tutorial - LARGER */}
              <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg lg:col-span-3">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-2xl font-bold text-cream mb-2">Video Tutorial</h2>
                </div>

                <div className="aspect-video bg-gray-800 relative">
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-20 h-20 rounded-full bg-mahogany/80 flex items-center justify-center cursor-pointer hover:bg-mahogany transition-colors">
                      <Play className="w-10 h-10 text-cream ml-1" />
                    </div>
                  </div>

                  {/* Video thumbnail/placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-redhat">
                    (Video would be embedded here)
                  </div>
                </div>

                <div className="p-6 bg-gray-800 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-cream font-medium">
                        Introduction to Wildfire Smoke Tool
                      </h3>
                      <p className="text-cream/70 text-sm font-redhat">Duration: 5:32</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'feedback' && (
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold text-forest mb-6">Submit Feedback</h2>
              <div className="h-1 w-20 bg-mahogany mb-6"></div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <Github className="w-6 h-6 text-forest mr-3" />
                  <h4 className="font-medium text-xl text-forest">GitHub Issues</h4>
                </div>

                <p className="text-forest-dark mb-6 font-redhat">
                  For bug reports, feature requests, and technical feedback, please submit a GitHub
                  issue. This helps us track and address your concerns effectively.
                </p>

                <div className="bg-cream border border-sage/50 rounded-lg p-5 flex items-center">
                  <div className="flex-1 text-forest-dark overflow-hidden text-ellipsis font-redhat">
                    github.com/wilkes-center/wildfire-smoke-tool/issues
                  </div>
                  <a
                    href="https://github.com/wilkes-center/wildfire-smoke-tool/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 px-5 py-2 bg-forest text-cream rounded-lg hover:bg-forest-dark transition-colors font-medium flex-shrink-0"
                  >
                    Submit Issue
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 px-8" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center">
          <p className="text-white font-redhat text-sm">
            The Wilkes Center for Climate Science & Policy
          </p>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] max-w-7xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-obsidian">Interactive Demo</h2>
              <button
                onClick={handleCloseDemo}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6">
              <iframe
                src="https://storymaps.arcgis.com/stories/72ed342efcdb42d2a60016835ad1fcdf"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="geolocation"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroPage;
