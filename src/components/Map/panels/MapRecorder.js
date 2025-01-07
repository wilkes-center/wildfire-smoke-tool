import React, { useState, useRef } from 'react';
import GIF from 'gif.js';
import { Download } from 'lucide-react';

const MapRecorder = ({ 
  minimapRef, 
  setIsPlaying, 
  setCurrentHour,
  TOTAL_HOURS,
  isDarkMode 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const frames = useRef([]);
  
  const captureFrame = async () => {
    if (!minimapRef.current) {
      console.error('No minimap ref found');
      return null;
    }
    
    try {
      const map = minimapRef.current.getMap();
      
      // Wait for map to finish rendering
      await new Promise(resolve => {
        if (map.loaded()) {
          resolve();
        } else {
          map.once('idle', resolve);
        }
      });
      
      // Get the canvas with all layers
      const canvas = map.getCanvas();
      
      // Create a new canvas to compose the frame
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      
      // Match dimensions exactly
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      // Copy the complete map view including basemap and layers
      ctx.drawImage(canvas, 0, 0);
      
      return new Promise((resolve) => {
        tempCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const startRecording = async () => {
    try {
      console.log('Starting recording process');
      setError(null);
      setIsRecording(true);
      frames.current = [];
      setProgress(0);
      
      // Pause any ongoing playback
      setIsPlaying(false);
      
      // Reset to start
      setCurrentHour(0);

      // Wait for initial render
      await delay(1000);
      
      // Capture frames
      for (let hour = 0; hour < TOTAL_HOURS; hour++) {
        console.log(`Processing hour ${hour}`);
        setCurrentHour(hour);
        
        // Wait for map update and render
        await delay(500);
        
        const frameUrl = await captureFrame();
        if (frameUrl) {
          console.log(`Captured frame ${hour}`);
          frames.current.push(frameUrl);
        } else {
          console.error(`Failed to capture frame ${hour}`);
        }
        
        setProgress((hour + 1) / TOTAL_HOURS * 100);
      }
      
      if (frames.current.length === 0) {
        throw new Error('No frames were captured');
      }
      
      // Create and download GIF
      await createGif();
      
      // Cleanup frame URLs
      frames.current.forEach(url => URL.revokeObjectURL(url));
      frames.current = [];
      
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to create GIF. Please try again.');
      // Cleanup on error
      frames.current.forEach(url => URL.revokeObjectURL(url));
      frames.current = [];
      setIsRecording(false);
    }
  };

  const createGif = async () => {
    try {
      console.log('Starting GIF creation');
      const map = minimapRef.current.getMap();
      const canvas = map.getCanvas();
      
      // Create GIF with inline worker to avoid path issues
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: undefined // Let gif.js use inline worker
      });

      // Load all frames
      const loadedImages = await Promise.all(
        frames.current.map(
          (frameUrl) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = frameUrl;
          })
        )
      );

      console.log(`Adding ${loadedImages.length} frames to GIF`);
      loadedImages.forEach(img => {
        gif.addFrame(img, { 
          delay: 200,
          dispose: 2
        });
      });

      // Render and download
      await new Promise((resolve, reject) => {
        gif.on('finished', blob => {
          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'area-overview.gif';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsRecording(false);
            setProgress(0);
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        gif.on('progress', p => {
          console.log(`GIF encoding progress: ${Math.round(p * 100)}%`);
        });

        gif.render();
      });
    } catch (err) {
      console.error('GIF creation error:', err);
      throw new Error('Failed to create GIF');
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors shadow-lg ${
            isDarkMode 
              ? 'bg-blue-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}
          disabled={isRecording}
        >
          <Download className="w-4 h-4" />
          <span>Download GIF</span>
        </button>
      ) : (
        <div className={`rounded-lg shadow-lg p-4 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
          <div className="text-sm mb-2">
            {error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              'Recording frames...'
            )}
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapRecorder;