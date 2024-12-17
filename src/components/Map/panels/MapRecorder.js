import React, { useState, useRef } from 'react';
import GIF from 'gif.js';
import { Download } from 'lucide-react';

const MapRecorder = ({ 
  minimapRef, 
  isPlaying, 
  setIsPlaying, 
  currentHour, 
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
    
    const map = minimapRef.current.getMap();
    
    try {
      // Get the canvas directly from Mapbox GL
      const canvas = map.getCanvas();
      
      // Create a new canvas to draw the map
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      
      // Match dimensions
      tempCanvas.width = 480;
      tempCanvas.height = 360;
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the map canvas
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      
      return tempCanvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  };

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

      // Wait for initial map load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Starting frame capture loop');
      // Start capturing frames
      for (let hour = 0; hour < TOTAL_HOURS; hour++) {
        console.log(`Capturing frame for hour ${hour}`);
        setCurrentHour(hour);
        
        // Wait for the map to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const frame = await captureFrame();
        if (frame) {
          console.log(`Successfully captured frame ${hour}`);
          frames.current.push(frame);
        } else {
          console.error(`Failed to capture frame ${hour}`);
        }
        
        setProgress((hour + 1) / TOTAL_HOURS * 100);
      }
      
      console.log(`Captured ${frames.current.length} frames`);
      if (frames.current.length === 0) {
        throw new Error('No frames were captured');
      }
      
      // Create and download GIF
      await createGif();
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to create GIF. Please try again.');
      setIsRecording(false);
    }
  };

  const createGif = async () => {
    try {
      console.log('Starting GIF creation');
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: 480,
        height: 360,
        workerScript: '/wildfire-webapp/gif.worker.js',
        background: '#ffffff'
      });

      console.log('Loading images');
      // Create and load all images before adding to GIF
      const loadedImages = await Promise.all(
        frames.current.map(
          (frame, index) => new Promise((resolve, reject) => {
            console.log(`Loading frame ${index}`);
            const img = new Image();
            img.onload = () => {
              console.log(`Frame ${index} loaded`);
              resolve(img);
            };
            img.onerror = (error) => {
              console.error(`Frame ${index} failed to load:`, error);
              reject(error);
            };
            img.src = frame;
          })
        )
      );

      console.log('Adding frames to GIF');
      loadedImages.forEach((img, index) => {
        console.log(`Adding frame ${index} to GIF`);
        gif.addFrame(img, { 
          delay: 200,
          dispose: 2
        });
      });

      // Add finished event handler before calling render
      console.log('Rendering GIF');
      await new Promise((resolve, reject) => {
        gif.on('finished', blob => {
          try {
            console.log('GIF rendering complete');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'area-overview.gif';
            a.click();
            
            URL.revokeObjectURL(url);
            setIsRecording(false);
            setProgress(0);
            resolve();
          } catch (err) {
            console.error('Error saving GIF:', err);
            reject(err);
          }
        });

        gif.on('progress', progress => {
          console.log(`GIF rendering progress: ${Math.round(progress * 100)}%`);
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
        >
          <Download className="w-4 h-4" />
          <span>Download GIF</span>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="text-sm text-gray-600 mb-2">
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