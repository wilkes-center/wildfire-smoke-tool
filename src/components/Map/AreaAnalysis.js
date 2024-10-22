import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import calculateAreaStats from './calculateAreaStats';

const styles = {
  container: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '450px',
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  buttonGroup: {
    display: 'flex',
    gap: '5px',
  },
  button: {
    padding: '5px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  activeButton: {
    backgroundColor: '#e6e6e6',
  },
  content: {
    padding: '15px',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  showButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#ffe6e6',
    color: '#ff0000',
    borderRadius: '4px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
    padding: '0 10px',
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
  },
  activeTab: {
    borderBottom: '2px solid #4a90e2',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  th: {
    textAlign: 'left',
    padding: '8px',
    borderBottom: '1px solid #ddd',
    backgroundColor: '#f5f5f5',
  },
  td: {
    padding: '8px',
    borderBottom: '1px solid #ddd',
  },
  aqiIndicator: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginRight: '8px',
  },
  minimized: {
    height: '50px',
    overflow: 'hidden',
  }
};

const AreaAnalysis = ({ map, currentDateTime, isPlaying, polygon }) => {
  const [areaStats, setAreaStats] = useState([]);
  const [accumulatedData, setAccumulatedData] = useState([]);
  const [error, setError] = useState(null);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);
  const [activeView, setActiveView] = useState('chart');

  const updateAreaStats = useCallback(() => {
    if (map && polygon) {
      setError(null);
      calculateAreaStats(map, polygon)
        .then(stats => {
          setAreaStats(stats);
          
          const newData = formatChartData(stats);
          setAccumulatedData(prevData => {
            const combinedData = [...prevData, ...newData];
            const uniqueData = combinedData.filter((v, i, a) => 
              a.findIndex(t => t.time === v.time) === i
            );
            return uniqueData.sort((a, b) => new Date(a.time) - new Date(b.time));
          });
        })
        .catch(err => {
          console.error('Error calculating area stats:', err);
          setError('Failed to calculate area statistics');
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

  if (!isStatsVisible) {
    return (
      <button 
        style={styles.showButton}
        onClick={() => setIsStatsVisible(true)}
      >
        Show Statistics
      </button>
    );
  }

  return (
    <div style={{...styles.container, ...(isStatsMinimized ? styles.minimized : {})}}>
      <div style={styles.header}>
        <h2 style={styles.title}>Area Statistics</h2>
        <div style={styles.buttonGroup}>
          <button
            style={styles.button}
            onClick={() => setIsStatsMinimized(!isStatsMinimized)}
          >
            {isStatsMinimized ? '↑' : '↓'}
          </button>
          <button
            style={styles.button}
            onClick={() => setIsStatsVisible(false)}
          >
            ×
          </button>
        </div>
      </div>

      {!isStatsMinimized && (
        <div style={styles.content}>
          <div>Current Time: {currentDateTime.date} {currentDateTime.hour}:00</div>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          {accumulatedData.length > 0 && (
            <>
              <div style={styles.tabs}>
                <button
                  style={{
                    ...styles.tab,
                    ...(activeView === 'chart' ? styles.activeTab : {})
                  }}
                  onClick={() => setActiveView('chart')}
                >
                  Chart View
                </button>
                <button
                  style={{
                    ...styles.tab,
                    ...(activeView === 'table' ? styles.activeTab : {})
                  }}
                  onClick={() => setActiveView('table')}
                >
                  Table View
                </button>
              </div>

              {activeView === 'chart' && (
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer>
                    <LineChart data={accumulatedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        angle={-45}
                        textAnchor="end"
                        height={40}
                        interval="preserveStartEnd"
                        tick={{ fontSize: 4 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="averageAQI" stroke="#8884d8" name="Average AQI" />
                      <Line type="monotone" dataKey="maxAQI" stroke="#82ca9d" name="Max AQI" />
                      <Line type="monotone" dataKey="minAQI" stroke="#ffc658" name="Min AQI" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeView === 'table' && (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Avg AQI</th>
                      <th style={styles.th}>Max AQI</th>
                      <th style={styles.th}>Min AQI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accumulatedData.map((hourData, index) => (
                      <tr key={index}>
                        <td style={styles.td}>{hourData.time}</td>
                        <td style={styles.td}>
                          <span style={{...styles.aqiIndicator, backgroundColor: getAQIColor(hourData.averageAQI)}} />
                          {hourData.averageAQI}
                        </td>
                        <td style={styles.td}>
                          <span style={{...styles.aqiIndicator, backgroundColor: getAQIColor(hourData.maxAQI)}} />
                          {hourData.maxAQI}
                        </td>
                        <td style={styles.td}>
                          <span style={{...styles.aqiIndicator, backgroundColor: getAQIColor(hourData.minAQI)}} />
                          {hourData.minAQI}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AreaAnalysis;