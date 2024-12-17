import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, X, Download } from 'lucide-react';
import calculateAreaStats from '../../../utils/map/calculateAreaStats';
import { Tooltip } from '../Tooltip';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium">{entry.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomXAxisTick = ({ x, y, payload }) => {
  const [date, time] = payload.value.split(' ');

  const dateColors = {
    '2024-10-15': '#4B5563',
    '2024-10-16': '#1D4ED8',
    '2024-10-17': '#047857'
  };

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill={dateColors[date] || '#6B7280'}
        transform="rotate(-45)"
        style={{ fontSize: '11px' }}
      >
        {time}
      </text>
    </g>
  );
};

const LegendContent = () => (
  <div className="absolute top-2 right-2 flex items-center gap-3 bg-white/80 px-2 py-1 rounded">
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-[#c52222]"></div>
      <span className="text-xs text-gray-600">Max</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
      <span className="text-xs text-gray-600">Avg</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-[#76f163]"></div>
      <span className="text-xs text-gray-600">Min</span>
    </div>
  </div>
);

const AreaAnalysis = ({ map, currentDateTime, isPlaying, polygon, onExpandChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [error, setError] = useState(null);
  const [areaStats, setAreaStats] = useState([]);
  const [accumulatedData, setAccumulatedData] = useState([]);

  const formatChartData = useCallback((stats) => {
    return stats.flatMap(tilesetStats =>
      tilesetStats.hourlyData.map(hourData => ({
        time: `${tilesetStats.date} ${String(hourData.hour).padStart(2, '0')}:00`,
        averageAQI: hourData.averageAQI,
        maxAQI: hourData.maxAQI,
        minAQI: hourData.minAQI
      }))
    ).sort((a, b) => new Date(a.time) - new Date(b.time));
  }, []);

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  const handleChartDownload = useCallback(() => {
    const svg = document.querySelector('.recharts-wrapper svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = svg.width.baseVal.value;
      canvas.height = svg.height.baseVal.value;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `aqi-analysis-${currentDateTime.date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [currentDateTime]);

  const handleTableDownload = useCallback(() => {
    if (!accumulatedData.length) return;

    const headers = ['Time', 'Average AQI', 'Max AQI', 'Min AQI'];
    const csvContent = [
      headers.join(','),
      ...accumulatedData.map(row => 
        [row.time, row.averageAQI, row.maxAQI, row.minAQI].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aqi-data-${currentDateTime.date}.csv`;
    link.click();
  }, [accumulatedData, currentDateTime]);

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
  }, [map, polygon, formatChartData]);

  useEffect(() => {
    updateAreaStats();
  }, [updateAreaStats]);

  useEffect(() => {
    if (isPlaying) {
      updateAreaStats();
    }
  }, [isPlaying, currentDateTime, updateAreaStats]);

  useEffect(() => {
    if (!polygon) {
      setIsExpanded(false);
      setAccumulatedData([]);
      setAreaStats([]);
      setError(null);
    }
  }, [polygon]);

  useEffect(() => {
    if (polygon) {
      setTimeout(() => {
        setIsExpanded(true);
        onExpandChange?.(true);
      }, 100);
    } else {
      setIsExpanded(false);
      setAccumulatedData([]);
      setAreaStats([]);
      setError(null);
      onExpandChange?.(false);
    }
  }, [polygon, onExpandChange]);

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: isExpanded ? '490px' : '80px',
        right: '20px',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <Tooltip content="Draw polygon to view area statistics" position="left">
        <button
          className="bg-white/70 rounded-lg shadow-md hover:bg-gray-50/70 transition-colors"
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: polygon ? 'pointer' : 'default',
            position: 'relative',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => polygon && setIsExpanded(!isExpanded)}
        >
          {!isExpanded ? (
            <BarChart2 className="w-5 h-5 text-gray-600" />
          ) : (
            <X className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </Tooltip>

      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            right: 0,
            width: '480px',
            height: '400px',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div className="w-full h-full">
            <div className="border-b border-gray-200/40">
              <div className="flex items-center justify-between px-3 pt-2 pb-2 bg-white/30">
                <div>
                  <h2 className="text-xl font-bold leading-none text-gray-800">Polygon Statistics</h2>
                  <div className="text-gray-600 text-sm mt-0.5">
                    {currentDateTime.date} {currentDateTime.hour.toString().padStart(2, '0')}:00
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    <button
                      onClick={() => setActiveTab('chart')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        activeTab === 'chart'
                          ? 'bg-blue-500/70 text-white'
                          : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                      }`}
                    >
                      Chart
                    </button>
                    {activeTab === 'chart' && (
                      <button
                        onClick={handleChartDownload}
                        className="ml-1 p-1 rounded-md hover:bg-gray-200/50"
                        title="Download Chart"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setActiveTab('table')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        activeTab === 'table'
                          ? 'bg-blue-500/70 text-white'
                          : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                      }`}
                    >
                      Table
                    </button>
                    {activeTab === 'table' && (
                      <button
                        onClick={handleTableDownload}
                        className="ml-1 p-1 rounded-md hover:bg-gray-200/50"
                        title="Download CSV"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-1">
              {error && (
                <div className="mb-4 p-4 bg-red-50/50 text-red-700 rounded-lg border border-red-200/50">
                  {error}
                </div>
              )}

              {activeTab === 'chart' && accumulatedData.length > 0 && (
                <div className="h-[320px] w-full relative bg-white/30">
                  <ResponsiveContainer>
                    <LineChart 
                      data={accumulatedData} 
                      margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="time"
                        height={45}
                        tick={<CustomXAxisTick />}
                        tickMargin={15}
                        axisLine={{ stroke: '#E5E7EB' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        domain={[0, 500]}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="maxAQI" 
                        stroke="#c52222"
                        strokeWidth={2}
                        dot={false}
                        name="Max AQI"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="averageAQI" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={false}
                        name="Average AQI"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="minAQI" 
                        stroke="#76f163"
                        strokeWidth={2}
                        dot={false}
                        name="Min AQI"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <LegendContent />
                </div>
              )}

              {activeTab === 'table' && accumulatedData.length > 0 && (
                <div className="max-h-[320px] overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white/30">
                      <tr className="border-b border-gray-200/40">
                        <th className="py-2 px-4 text-left text-gray-600 font-medium">Time</th>
                        <th className="py-2 px-4 text-left text-gray-600 font-medium">Avg AQI</th>
                        <th className="py-2 px-4 text-left text-gray-600 font-medium">Max AQI</th>
                        <th className="py-2 px-4 text-left text-gray-600 font-medium">Min AQI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accumulatedData.map((data, index) => (
                        <tr key={index} className="border-b border-gray-200/40 hover:bg-gray-50/30">
                          <td className="py-2 px-4 text-gray-800">{data.time}</td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: getAQIColor(data.averageAQI) }}
                              />
                              <span className="text-gray-800">{data.averageAQI.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: getAQIColor(data.maxAQI) }}
                              />
                              <span className="text-gray-800">{data.maxAQI.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: getAQIColor(data.minAQI) }}
                              />
                              <span className="text-gray-800">{data.minAQI.toFixed(2)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {accumulatedData.length === 0 && !error && (
                <div className="h-[320px] flex items-center justify-center text-gray-500">
                  <p>No data available for the selected area</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaAnalysis;