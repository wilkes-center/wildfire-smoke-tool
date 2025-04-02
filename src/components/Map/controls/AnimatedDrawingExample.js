import React, { useEffect, useRef } from 'react';

const DrawingAnimation = ({ isDarkMode }) => {
  const canvasRef = useRef(null);
  
  // Animation paths to demonstrate drawing
  const steps = [
    { type: 'move', x: 40, y: 30, delay: 1000 },
    { type: 'click', x: 40, y: 30, delay: 300 },
    { type: 'move', x: 80, y: 45, delay: 800 },
    { type: 'click', x: 80, y: 45, delay: 300 },
    { type: 'move', x: 70, y: 85, delay: 800 },
    { type: 'click', x: 70, y: 85, delay: 300 },
    { type: 'move', x: 30, y: 70, delay: 800 },
    { type: 'click', x: 30, y: 70, delay: 300 },
    { type: 'move', x: 40, y: 30, delay: 800 },
    { type: 'doubleClick', x: 40, y: 30, delay: 500 },
    { type: 'fill', delay: 300 }
  ];
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const colors = {
      background: isDarkMode ? '#1f2937' : '#f3f4f6',
      landmass: isDarkMode ? '#374151' : '#e5e7eb',
      water: isDarkMode ? '#1e3a8a' : '#bfdbfe',
      cursor: '#ffffff',
      pointFill: isDarkMode ? '#c084fc' : '#c084fc',
      pointStroke: isDarkMode ? '#8b5cf6' : '#8b5cf6',
      polygonFill: isDarkMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.3)',
      polygonStroke: isDarkMode ? '#8b5cf6' : '#8b5cf6',
      cursorBorder: isDarkMode ? '#751d0c' : '#751d0c',
    };
    
    const points = [];
    let currentStep = 0;
    let animationFrame;
    
    // Clear and draw the map background
    const drawBackground = () => {
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw a simplified map with water and land
      ctx.fillStyle = colors.water;
      ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Draw a landmass
      ctx.fillStyle = colors.landmass;
      ctx.beginPath();
      ctx.moveTo(30, 20);
      ctx.lineTo(80, 30);
      ctx.lineTo(90, 70);
      ctx.lineTo(60, 90);
      ctx.lineTo(20, 70);
      ctx.closePath();
      ctx.fill();
    };
    
    // Draw current polygon
    const drawPolygon = () => {
      if (points.length < 2) return;
      
      // Draw lines connecting points
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      if (points.length > 2) {
        ctx.closePath();
        ctx.fillStyle = colors.polygonFill;
        ctx.fill();
      }
      
      ctx.strokeStyle = colors.polygonStroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    
    // Draw points
    const drawPoints = () => {
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = colors.pointFill;
        ctx.fill();
        ctx.strokeStyle = colors.pointStroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };
    
    // Draw cursor
    const drawCursor = (x, y, isClicking = false) => {
      ctx.beginPath();
      ctx.arc(x, y, isClicking ? 6 : 10, 0, Math.PI * 2);
      ctx.strokeStyle = colors.cursorBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(x, y, isClicking ? 3 : 5, 0, Math.PI * 2);
      ctx.fillStyle = colors.cursorBorder;
      ctx.fill();
    };
    
    // Show click effect
    const showClick = (x, y) => {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.fill();
    };
    
    // Process an animation step
    const processStep = (step) => {
      switch (step.type) {
        case 'move':
          // Just update the frame to show cursor movement
          break;
        case 'click':
          // Add a point to the polygon
          points.push({ x: step.x, y: step.y });
          showClick(step.x, step.y);
          break;
        case 'doubleClick':
          showClick(step.x, step.y);
          // Second click for double-click
          setTimeout(() => showClick(step.x, step.y), 100);
          break;
        case 'fill':
          // Final polygon is already drawn
          break;
      }
    };
    
    // Run the animation
    const animate = () => {
      if (currentStep >= steps.length) {
        currentStep = 0;
        points.length = 0;
      }
      
      const step = steps[currentStep];
      
      // Draw frame
      drawBackground();
      drawPolygon();
      drawPoints();
      
      if (step.type !== 'fill') {
        drawCursor(step.x, step.y, step.type === 'click' || step.type === 'doubleClick');
      }
      
      // Process the current step
      processStep(step);
      
      // Schedule next step
      setTimeout(() => {
        currentStep++;
        animationFrame = requestAnimationFrame(animate);
      }, step.delay);
    };
    
    // Start animation
    animationFrame = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isDarkMode]);
  
  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={75}
      className="rounded-lg shadow-sm w-full h-full object-contain"
    />
  );
};

export default DrawingAnimation;