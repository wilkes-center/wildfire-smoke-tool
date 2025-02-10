import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, X } from 'lucide-react';
import calculateAreaStats from '../../../utils/map/calculateAreaStats';

const CustomTooltip = ({ active, payload, label, isDarkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-4 shadow-lg rounded-lg border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 text-gray-100' 
          : 'bg-white border-gray-200 text-gray-800'
      }`}>
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{entry.name}:</span>
            <span className="font-medium">{entry.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomXAxisTick = ({ x, y, payload, isDarkMode }) => {
  const [date, time] = payload.value.split(' ');

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill={(isDarkMode ? '#9CA3AF' : '#6B7280')}
        transform="rotate(-45)"
        style={{ fontSize: '11px' }}
      >
        {time}
      </text>
    </g>
  );
};

const LegendContent = ({ isDarkMode }) => (
  <div className={`absolute top-2 right-2 flex items-center gap-3 px-2 py-1 rounded ${
    isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
  }`}>
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-[#c52222]"></div>
      <span className={isDarkMode ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>Max</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
      <span className={isDarkMode ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>Avg</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-[#76f163]"></div>
      <span className={isDarkMode ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>Min</span>
    </div>
  </div>
);

const getPM25Style = (value, isDarkMode) => {
  if (value <= 12) return {
    color: '#16a34a',
    background: isDarkMode ? 'rgba(22, 163, 74, 0.1)' : 'rgba(22, 163, 74, 0.1)'
  };
  if (value <= 35.5) return {
    color: '#ca8a04',
    background: isDarkMode ? 'rgba(202, 138, 4, 0.1)' : 'rgba(202, 138, 4, 0.1)'
  };
  if (value <= 55.5) return {
    color: '#ea580c',
    background: isDarkMode ? 'rgba(234, 88, 12, 0.1)' : 'rgba(234, 88, 12, 0.1)'
  };
  if (value <= 150.5) return {
    color: '#dc2626',
    background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.1)'
  };
  if (value <= 250.5) return {
    color: '#9333ea',
    background: isDarkMode ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.1)'
  };
  return {
    color: '#881337',
    background: isDarkMode ? 'rgba(136, 19, 55, 0.1)' : 'rgba(136, 19, 55, 0.1)'
  };
};

const StatsTable = ({ data, isDarkMode }) => {
  const headerStyles = {
    min: { label: 'Min PM2.5', color: '#00e400', textColor: '#006400' },
    avg: { label: 'Avg PM2.5', color: '#3B82F6', textColor: '#1D4ED8' },
    max: { label: 'Max PM2.5', color: '#ff0000', textColor: '#990000' }
  };

  return (
    <div className="h-[320px] overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0">
          <tr>
            <th className="py-2 px-4 text-left font-medium text-gray-600 bg-transparent">
              Date & Time
            </th>
            {Object.entries(headerStyles).map(([key, style]) => (
              <th 
                key={key}
                className="py-2 px-4 text-left font-medium"
                style={{
                  color: isDarkMode ? style.color : style.textColor,
                  backgroundColor: `${style.color}15`
                }}
              >
                {style.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr 
              key={index} 
              className="border-b border-gray-200/20"
            >
              <td className="py-2 px-4 text-gray-600 bg-transparent">
                {row.time}
              </td>
              <td 
                className="py-2 px-4"
                style={{
                  backgroundColor: `${headerStyles.min.color}08`
                }}
              >
                <span className="px-2 py-0.5 rounded font-medium" style={{
                  color: isDarkMode ? headerStyles.min.color : headerStyles.min.textColor,
                  backgroundColor: `${headerStyles.min.color}15`
                }}>
                  {row.minPM25.toFixed(1)}
                </span>
              </td>
              <td 
                className="py-2 px-4"
                style={{
                  backgroundColor: `${headerStyles.avg.color}08`
                }}
              >
                <span className="px-2 py-0.5 rounded font-medium" style={{
                  color: isDarkMode ? headerStyles.avg.color : headerStyles.avg.textColor,
                  backgroundColor: `${headerStyles.avg.color}15`
                }}>
                  {row.averagePM25.toFixed(1)}
                </span>
              </td>
              <td 
                className="py-2 px-4"
                style={{
                  backgroundColor: `${headerStyles.max.color}08`
                }}
              >
                <span className="px-2 py-0.5 rounded font-medium" style={{
                  color: isDarkMode ? headerStyles.max.color : headerStyles.max.textColor,
                  backgroundColor: `${headerStyles.max.color}15`
                }}>
                  {row.maxPM25.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StatsChart = ({ data, isDarkMode }) => (
  <div className={`h-[320px] w-full relative ${
    isDarkMode ? 'bg-gray-800/30' : 'bg-white/30'
  }`}>
    <ResponsiveContainer>
      <LineChart 
        data={data} 
        margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={isDarkMode ? '#374151' : '#E5E7EB'} 
        />
        <XAxis 
          dataKey="time"
          height={45}
          tick={<CustomXAxisTick isDarkMode={isDarkMode} />}
          tickMargin={15}
          axisLine={{ stroke: isDarkMode ? '#374151' : '#E5E7EB' }}
          interval={0}
        />
        <YAxis 
          tick={{ 
            fill: isDarkMode ? '#9CA3AF' : '#6B7280', 
            fontSize: 12 
          }}
          domain={[0, 'dataMax + 10']}
          axisLine={{ stroke: isDarkMode ? '#374151' : '#E5E7EB' }}
        />
        <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
        <Line 
          type="monotone" 
          dataKey="maxPM25"
          name="Max PM2.5" 
          stroke="#c52222"
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="averagePM25"
          name="Average PM2.5" 
          stroke="#3B82F6" 
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="minPM25"
          name="Min PM2.5" 
          stroke="#76f163"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
    <LegendContent isDarkMode={isDarkMode} />
  </div>
);

const AreaAnalysis = ({ 
  map, 
  currentDateTime, 
  isPlaying, 
  polygon, 
  isDarkMode,
  onExpandChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatChartData = useCallback((stats) => {
    return stats.flatMap(tilesetStats =>
      tilesetStats.hourlyData.map(hourData => ({
        time: `${tilesetStats.date} ${String(hourData.hour).padStart(2, '0')}:00`,
        averagePM25: hourData.averagePM25,
        maxPM25: hourData.maxPM25,
        minPM25: hourData.minPM25,
        points: hourData.numPoints
      }))
    ).sort((a, b) => new Date(a.time) - new Date(b.time));
  }, []);

  const updateAreaStats = useCallback(async () => {
    if (!map || !polygon) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const stats = await calculateAreaStats(map, polygon);
      const formattedData = formatChartData(stats);
      
      setData(prevData => {
        const combinedData = [...prevData, ...formattedData];
        const uniqueData = combinedData.filter((v, i, a) =>
          a.findIndex(t => t.time === v.time) === i
        );
        return uniqueData.sort((a, b) => new Date(a.time) - new Date(b.time));
      });
    } catch (err) {
      console.error('Error calculating area stats:', err);
      setError('Failed to calculate area statistics');
      setData([]);
    } finally {
      setIsLoading(false);
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
      setData([]);
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
      setData([]);
      setError(null);
      onExpandChange?.(false);
    }
  }, [polygon, onExpandChange]);

  return (
    <div style={{ 
      position: 'fixed',
      top: isExpanded ? '490px' : '80px',
      right: '20px',
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out'
    }}>
      <button
        className={`rounded-lg shadow-md transition-colors w-12 h-12 flex items-center justify-center backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-gray-900/70 hover:bg-gray-800/70' 
            : 'bg-white/70 hover:bg-gray-50/70'
        }`}
        onClick={() => polygon && setIsExpanded(!isExpanded)}
        disabled={!polygon}
        title={polygon ? "View area statistics" : "Draw an area to view statistics"}
      >
        {!isExpanded ? (
          <BarChart2 className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        ) : (
          <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        )}
      </button>

      {isExpanded && (
        <div className={`absolute top-14 right-0 w-[480px] h-[400px] rounded-lg shadow-lg overflow-hidden border-2 border-[#DC4A23] ${
          isDarkMode 
            ? 'bg-gray-900/40 backdrop-blur-sm' 
            : 'bg-white/40 backdrop-blur-sm'
        }`}>
          <div className="w-full h-full">
            <div className={`border-b px-3 py-2 ${
              isDarkMode 
                ? 'border-gray-700/40 bg-gray-900/30' 
                : 'border-gray-200/40 bg-white/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold leading-none ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    Area Statistics
                  </h2>
                  <div className={`text-sm mt-0.5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {currentDateTime.date} {currentDateTime.hour.toString().padStart(2, '0')}:00
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      activeTab === 'chart'
                        ? isDarkMode
                          ? 'bg-blue-500/70 text-white'
                          : 'bg-blue-500/70 text-white'
                        : isDarkMode
                          ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                          : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setActiveTab('table')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      activeTab === 'table'
                        ? isDarkMode
                          ? 'bg-blue-500/70 text-white'
                          : 'bg-blue-500/70 text-white'
                        : isDarkMode
                          ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                          : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>

            <div className="px-1">
              {error && (
                <div className={`mb-4 p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-red-900/50 text-red-300 border-red-800/50' 
                    : 'bg-red-50/50 text-red-700 border-red-200/50'
                }`}>
                  {error}
                </div>
              )}

              {isLoading && (
                <div className={`h-[320px] flex items-center justify-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <p>Loading statistics...</p>
                </div>
              )}

              {!isLoading && !error && data.length > 0 && (
                <>
                  {activeTab === 'chart' && (
                    <StatsChart data={data} isDarkMode={isDarkMode} />
                  )}
                  
                  {activeTab === 'table' && (
                    <StatsTable data={data} isDarkMode={isDarkMode} />
                  )}
                </>
              )}

              {!isLoading && !error && data.length === 0 && (
                <div className={`h-[320px] flex items-center justify-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
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