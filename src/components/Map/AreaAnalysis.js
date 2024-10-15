import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import calculateAreaStats from './calculateAreaStats';

const AreaAnalysis = ({ map, currentDateTime, isPlaying }) => {
  const [drawingMode, setDrawingMode] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [areaStats, setAreaStats] = useState([]);
  const [tempPolygon, setTempPolygon] = useState([]);
  const [error, setError] = useState(null);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);
  const polygonLayerId = useRef('polygon-layer');
  const polygonSourceId = useRef('polygon-source');

  const startDrawing = useCallback(() => {
    setDrawingMode(true);
    setTempPolygon([]);
    setPolygon(null);
    if (map) {
      map.getCanvas().style.cursor = 'crosshair';
    }
  }, [map]);

  const handleClick = useCallback((e) => {
    if (!drawingMode) return;
    const { lng, lat } = e.lngLat;
    setTempPolygon(prev => [...prev, [lng, lat]]);
  }, [drawingMode]);

  const finishDrawing = useCallback(() => {
    if (tempPolygon.length >= 3) {
      setPolygon([...tempPolygon, tempPolygon[0]]);
      setDrawingMode(false);
      setTempPolygon([]);
      if (map) {
        map.getCanvas().style.cursor = '';
      }
    }
  }, [tempPolygon, map]);

  useEffect(() => {
    if (map) {
      map.on('click', handleClick);
      return () => map.off('click', handleClick);
    }
  }, [map, handleClick]);

  useEffect(() => {
    if (!map) return;

    if (map.getSource(polygonSourceId.current)) {
      if (map.getLayer(polygonLayerId.current)) {
        map.removeLayer(polygonLayerId.current);
      }
      map.removeSource(polygonSourceId.current);
    }

    if (polygon || tempPolygon.length > 0) {
      map.addSource(polygonSourceId.current, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [polygon || [...tempPolygon, tempPolygon[0]]]
          }
        }
      });

      map.addLayer({
        id: polygonLayerId.current,
        type: 'fill',
        source: polygonSourceId.current,
        paint: {
          'fill-color': 'blue',
          'fill-opacity': 0.2,
        }
      });

      map.addLayer({
        id: `${polygonLayerId.current}-outline`,
        type: 'line',
        source: polygonSourceId.current,
        paint: {
          'line-color': 'blue',
          'line-width': 2,
        }
      });
    }

    return () => {
      if (map.getLayer(polygonLayerId.current)) {
        map.removeLayer(polygonLayerId.current);
      }
      if (map.getLayer(`${polygonLayerId.current}-outline`)) {
        map.removeLayer(`${polygonLayerId.current}-outline`);
      }
      if (map.getSource(polygonSourceId.current)) {
        map.removeSource(polygonSourceId.current);
      }
    };
  }, [map, polygon, tempPolygon]);

  const updateAreaStats = useCallback(() => {
    if (map && polygon) {
      setError(null);
      calculateAreaStats(map, polygon)
        .then(stats => {
          console.log('Calculated stats:', stats);
          setAreaStats(stats);
        })
        .catch(err => {
          console.error('Error calculating area stats:', err);
          setError('Failed to calculate area statistics. Please try again.');
          setAreaStats([]);
        });
    }
  }, [map, polygon]);

  useEffect(() => {
    updateAreaStats();
  }, [updateAreaStats]);

  useEffect(() => {
    if (isPlaying) {
      updateAreaStats();
    }
  }, [isPlaying, currentDateTime, updateAreaStats]);

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  const toggleStatsVisibility = () => {
    setIsStatsVisible(!isStatsVisible);
    setIsStatsMinimized(false);
  };

  const toggleStatsMinimized = () => {
    setIsStatsMinimized(!isStatsMinimized);
  };

  const formatChartData = (stats) => {
    return stats.flatMap(tilesetStats => 
      tilesetStats.hourlyData.map(hourData => ({
        time: `${tilesetStats.date} ${String(hourData.hour).padStart(2, '0')}:00`,
        averageAQI: hourData.averageAQI,
        maxAQI: hourData.maxAQI,
        minAQI: hourData.minAQI
      }))
    ).sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  const consolidateHourlyData = (stats) => {
    return stats.flatMap(tilesetStats => 
      tilesetStats.hourlyData.map(hourData => ({
        date: tilesetStats.date,
        hour: hourData.hour,
        averageAQI: hourData.averageAQI,
        maxAQI: hourData.maxAQI,
        minAQI: hourData.minAQI,
        numPoints: hourData.numPoints
      }))
    ).sort((a, b) => {
      const dateA = new Date(`${a.date}T${String(a.hour).padStart(2, '0')}:00:00`);
      const dateB = new Date(`${b.date}T${String(b.hour).padStart(2, '0')}:00:00`);
      return dateA - dateB;
    });
  };

  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
        {!drawingMode && !polygon && (
          <button onClick={startDrawing}>Draw Polygon</button>
        )}
        {drawingMode && (
          <button onClick={finishDrawing}>Finish Drawing</button>
        )}
        {polygon && !drawingMode && (
          <button onClick={() => setPolygon(null)}>Clear Polygon</button>
        )}
      </div>

      {error && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'red', color: 'white', padding: 10 }}>
          {error}
        </div>
      )}

      {areaStats.length > 0 && isStatsVisible && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'white',
          padding: 10,
          maxWidth: '800px',
          maxHeight: isStatsMinimized ? '40px' : '80vh',
          overflowY: isStatsMinimized ? 'hidden' : 'auto',
          transition: 'max-height 0.3s ease-in-out',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Area Statistics</h3>
            <div>
              <button onClick={toggleStatsMinimized} style={{ marginRight: '5px' }}>
                {isStatsMinimized ? 'Expand' : 'Minimize'}
              </button>
              <button onClick={toggleStatsVisibility}>Close</button>
            </div>
          </div>
          
          {!isStatsMinimized && (
            <>
              <p>Current Time: {currentDateTime.date} {currentDateTime.hour}:00</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData(areaStats)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ background: 'white', padding: '5px', border: '1px solid #ccc' }}>
                          <p><strong>{label}</strong></p>
                          <p>Average AQI: {data.averageAQI}</p>
                          <p>Max AQI: {data.maxAQI}</p>
                          <p>Min AQI: {data.minAQI}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="averageAQI" stroke="#8884d8" name="Average AQI" />
                  <Line type="monotone" dataKey="maxAQI" stroke="#82ca9d" name="Max AQI" />
                  <Line type="monotone" dataKey="minAQI" stroke="#ffc658" name="Min AQI" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '10px' }}>
                <h4>AQI Summary</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Hour</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Avg AQI</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Max AQI</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Min AQI</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidateHourlyData(areaStats).map((hourData, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{hourData.date}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{hourData.hour}:00</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: getAQIColor(hourData.averageAQI) }}>{hourData.averageAQI}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: getAQIColor(hourData.maxAQI) }}>{hourData.maxAQI}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: getAQIColor(hourData.minAQI) }}>{hourData.minAQI}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{hourData.numPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AreaAnalysis;