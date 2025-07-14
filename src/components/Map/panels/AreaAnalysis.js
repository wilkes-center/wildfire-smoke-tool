import React, { useCallback, useEffect, useState } from 'react';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { BarChart2 } from 'lucide-react';

import calculateAreaStats from '../../../utils/map/calculateAreaStats';
import { TILESET_INFO } from '../../../utils/map/constants';

import ThemedPanel from './ThemedPanel';

const DateSeparator = ({ x, isDarkMode }) => (
  <line
    x1={x}
    y1={0}
    x2={x}
    y2="100%"
    stroke={isDarkMode ? '#4B5563' : '#E5E7EB'}
    strokeWidth={1}
    strokeDasharray="3 3"
  />
);

const StatsTable = ({ data, isDarkMode }) => {
  const headerStyles = {
    min: { label: 'Min PM<sub>2.5</sub>', color: '#00e400', textColor: '#006400' },
    avg: { label: 'Avg PM<sub>2.5</sub>', color: '#3B82F6', textColor: '#1D4ED8' },
    max: { label: 'Max PM<sub>2.5</sub>', color: '#ff0000', textColor: '#990000' }
  };

  return (
    <div className="h-[clamp(18rem,20vh,25rem)] overflow-auto">
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
                dangerouslySetInnerHTML={{ __html: style.label }}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b border-mahogany/20">
              <td className="py-2 px-4 text-gray-600 bg-transparent">{row.time}</td>
              <td
                className="py-2 px-4"
                style={{
                  backgroundColor: `${headerStyles.min.color}08`
                }}
              >
                <span
                  className="px-2 py-0.5 rounded font-medium"
                  style={{
                    color: isDarkMode ? headerStyles.min.color : headerStyles.min.textColor,
                    backgroundColor: `${headerStyles.min.color}15`
                  }}
                >
                  {row.minPM25.toFixed(1)}
                </span>
              </td>
              <td
                className="py-2 px-4"
                style={{
                  backgroundColor: `${headerStyles.avg.color}08`
                }}
              >
                <span
                  className="px-2 py-0.5 rounded font-medium"
                  style={{
                    color: isDarkMode ? headerStyles.avg.color : headerStyles.avg.textColor,
                    backgroundColor: `${headerStyles.avg.color}15`
                  }}
                >
                  {row.averagePM25.toFixed(1)}
                </span>
              </td>
              <td
                className="py-2 px-4"
                style={{
                  backgroundColor: `${headerStyles.max.color}08`
                }}
              >
                <span
                  className="px-2 py-0.5 rounded font-medium"
                  style={{
                    color: isDarkMode ? headerStyles.max.color : headerStyles.max.textColor,
                    backgroundColor: `${headerStyles.max.color}15`
                  }}
                >
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

const AreaStatsChart = ({ data, isDarkMode }) => {
  const generateComplete48HourTimeline = () => {
    const timeline = [];

    // Get unique dates from TILESET_INFO and sort them
    const uniqueDates = [...new Set(TILESET_INFO.map(tileset => tileset.date))].sort();

    // Generate 24 hours for each date
    uniqueDates.forEach(dateStr => {
      for (let hour = 0; hour < 24; hour++) {
        const timeString = `${dateStr} ${String(hour).padStart(2, '0')}:00`;
        timeline.push(timeString);
      }
    });

    return timeline;
  };

  const createCompleteDataset = () => {
    const completeTimeline = generateComplete48HourTimeline();
    const dataMap = new Map(data.map(item => [item.time, item]));

    return completeTimeline.map(timePoint => {
      const existingData = dataMap.get(timePoint);

      return {
        time: timePoint,
        minPM25: existingData?.minPM25 ?? 0,
        averagePM25: existingData?.averagePM25 ?? 0,
        maxPM25: existingData?.maxPM25 ?? 0,
        hasData: !!existingData
      };
    });
  };

  const completeData = createCompleteDataset();

  const dateChangePoints = completeData.reduce((acc, item, index) => {
    if (index === 0) return acc;
    const [prevDate] = completeData[index - 1].time.split(' ');
    const [currentDate] = item.time.split(' ');
    if (prevDate !== currentDate) {
      acc.push(index);
    }
    return acc;
  }, []);

  const findMaxValue = () => {
    const values = completeData
      .flatMap(item => [item.minPM25, item.averagePM25, item.maxPM25])
      .filter(val => val !== undefined && val !== null && !isNaN(val));

    if (values.length === 0) return 100;

    const max = Math.max(...values);

    if (max < 2) {
      return Math.ceil(max * 1.05);
    } else {
      return Math.ceil(max * 1.1);
    }
  };

  const max = findMaxValue();

  const CustomXAxisTick = ({ x, y, payload, isDarkMode }) => {
    const [date, time] = payload.value.split(' ');
    const hour = parseInt(time);

    const showDate = hour === 0;
    const showHour = hour % 6 === 0 && hour !== 0;
    if (!showDate && !showHour) return null;

    const content = showDate ? (
      <text
        x={x}
        y={y + 16}
        textAnchor="middle"
        fill={isDarkMode ? '#9CA3AF' : '#6B7280'}
        style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
      >
        {(() => {
          const [year, month, day] = date.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        })()}
      </text>
    ) : (
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fill={isDarkMode ? '#9CA3AF' : '#6B7280'}
        style={{ fontSize: '0.6875rem' }}
      >
        {`${hour}:00`}
      </text>
    );

    return content;
  };

  const CustomTooltip = ({ active, payload, label, isDarkMode }) => {
    if (active && payload && payload.length) {
      const dataPoint = completeData.find(item => item.time === label);

      return (
        <div
          className={`p-4 shadow-lg rounded-lg border ${
            isDarkMode
              ? 'bg-gray-800 border-mahogany/70 text-gray-100'
              : 'bg-white border-mahogany/50 text-gray-800'
          }`}
        >
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{entry.name}:</span>
              <span className="font-medium">{entry.value?.toFixed(1) || '0.0'}</span>
            </div>
          ))}
          {!dataPoint?.hasData && (
            <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              No smoke forecasted (PM<sub>2.5</sub> = 0)
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`h-[clamp(18rem,20vh,25rem)] w-full relative ${isDarkMode ? 'bg-gray-800/30' : 'bg-white/30'}`}
    >
      <ResponsiveContainer>
        <LineChart data={completeData} margin={{ top: 20, right: 10, left: 30, bottom: 30 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkMode ? '#374151' : '#E5E7EB'}
            vertical={false}
          />
          {dateChangePoints.map(index => (
            <DateSeparator
              key={index}
              x={`${(index / (completeData.length - 1)) * 100}%`}
              isDarkMode={isDarkMode}
            />
          ))}
          <XAxis
            dataKey="time"
            height={25}
            tick={<CustomXAxisTick isDarkMode={isDarkMode} />}
            interval={0}
            tickSize={3}
            axisLine={{ stroke: isDarkMode ? '#374151' : '#E5E7EB' }}
          />
          <YAxis
            tick={{
              fill: isDarkMode ? '#9CA3AF' : '#6B7280',
              fontSize: 12
            }}
            domain={[0, max]}
            axisLine={{ stroke: isDarkMode ? '#374151' : '#E5E7EB' }}
            label={{
              value: 'PM₂.₅ (μg/m³)',
              angle: -90,
              position: 'insideLeft',
              style: {
                textAnchor: 'middle',
                fill: isDarkMode ? '#9CA3AF' : '#6B7280',
                fontSize: 12,
                fontWeight: 500,
                paddingLeft: 10
              }
            }}
          />
          <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
          <Line
            type="monotone"
            dataKey="maxPM25"
            name="Max PM<sub>2.5</sub>"
            stroke="#c52222"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="averagePM25"
            name="Average PM<sub>2.5</sub>"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="minPM25"
            name="Min PM<sub>2.5</sub>"
            stroke="#76f163"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div
        className={`absolute top-2 right-2 flex items-center gap-3 px-2 py-1 rounded ${
          isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
        }`}
      >
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#c52222]"></div>
          <span className={isDarkMode ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>
            Max
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
          <span className={isDarkMode ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>
            Avg
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#76f163]"></div>
          <span className={isDarkMode ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>
            Min
          </span>
        </div>
      </div>
    </div>
  );
};

const AreaAnalysis = ({
  map,
  currentDateTime,
  isPlaying,
  polygon,
  isDarkMode,
  onExpandChange,
  forceExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearAreaStatistics = useCallback(() => {
    setData([]);
    setError(null);
    setIsExpanded(false);
    setActiveTab('chart');
    setIsLoading(false);
    onExpandChange?.(false);
  }, [onExpandChange]);

  useEffect(() => {
    if (!polygon) {
      clearAreaStatistics();
    }

    const handleClearEvent = () => {
      clearAreaStatistics();
    };

    window.addEventListener('clearAreaStatistics', handleClearEvent);

    return () => {
      window.removeEventListener('clearAreaStatistics', handleClearEvent);
    };
  }, [polygon, clearAreaStatistics]);

  const formatChartData = useCallback(stats => {
    return stats
      .flatMap(tilesetStats =>
        tilesetStats.hourlyData.map(hourData => ({
          time: `${tilesetStats.date} ${String(hourData.hour).padStart(2, '0')}:00`,
          averagePM25: hourData.averagePM25,
          maxPM25: hourData.maxPM25,
          minPM25: hourData.minPM25,
          points: hourData.numPoints
        }))
      )
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }, []);

  const updateAreaStats = useCallback(async () => {
    if (!map || !polygon) return;

    try {
      setIsLoading(true);
      setError(null);

      // Add a small delay to ensure layers are loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Starting area stats calculation...');
      console.log('Map instance:', map);
      console.log('Polygon:', polygon);
      console.log('Map style loaded:', map.isStyleLoaded());

      const stats = await calculateAreaStats(map, polygon);
      console.log('Raw stats from calculateAreaStats:', stats);

      const formattedData = formatChartData(stats);
      console.log('Formatted chart data:', formattedData);

      if (formattedData.length === 0) {
        console.warn('No data found for the selected area. This could be because:');
        console.warn('1. The area is outside the data coverage');
        console.warn('2. The map layers are not fully loaded yet');
        console.warn('3. There is no PM<sub>2.5</sub> data for this location');
        setError('No smoke forecasted in this area.');
      }

      setData(formattedData);
    } catch (err) {
      console.error('Error calculating area stats:', err);
      setError('Failed to calculate area statistics. Please try again.');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [map, polygon, formatChartData]);

  useEffect(() => {
    if (polygon) {
      updateAreaStats();
    }
  }, [polygon, updateAreaStats]);

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

  const handleToggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  };

  const headerActions = (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setActiveTab('chart')}
        className={`px-3 py-1 rounded-md text-sm transition-colors ${
          activeTab === 'chart'
            ? isDarkMode
              ? 'bg-forest/70 text-gold-light'
              : 'bg-forest/70 text-cream'
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
              ? 'bg-forest/70 text-gold-light'
              : 'bg-forest/70 text-cream'
            : isDarkMode
              ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
        }`}
      >
        Table
      </button>
    </div>
  );

  const panelContent = (
    <div className="px-1">
      {error && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            isDarkMode
              ? 'bg-rust/50 text-gold-light border-mahogany/50'
              : 'bg-rust-light/20 text-rust-dark border-mahogany/30'
          }`}
        >
          {error}
        </div>
      )}

      {isLoading && (
        <div
          className={`h-[clamp(18rem,20vh,25rem)] flex items-center justify-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <p>Loading statistics...</p>
        </div>
      )}

      {!isLoading && !error && data.length > 0 && (
        <>
          {activeTab === 'chart' && <AreaStatsChart data={data} isDarkMode={isDarkMode} />}

          {activeTab === 'table' && <StatsTable data={data} isDarkMode={isDarkMode} />}
        </>
      )}

      {!isLoading && !error && data.length === 0 && (
        <div
          className={`h-[clamp(18rem,20vh,25rem)] flex items-center justify-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <p>No smoke forecasted in the selected area</p>
        </div>
      )}
    </div>
  );

  // If forceExpanded, render content directly without ThemedPanel wrapper
  if (forceExpanded) {
    return (
      <div
        className={`w-full rounded-xl shadow-xl overflow-hidden border-2 ${
          isDarkMode ? 'bg-gray-900/95 border-white' : 'bg-white/95 border-mahogany'
        } backdrop-blur-md`}
      >
        <div className="w-full h-full flex flex-col">
          <div
            className={`px-4 py-3 border-b-2 ${
              isDarkMode
                ? 'bg-gradient-to-r from-forest-dark/30 to-sage-dark/30 border-white'
                : 'bg-gradient-to-r from-cream to-sage-light/30 border-mahogany'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-lg font-semibold leading-none ${
                    isDarkMode ? 'text-white' : 'text-forest'
                  }`}
                >
                  Area Statistics
                </h2>
                <div
                  className={`text-sm mt-1 ${isDarkMode ? 'text-white/80' : 'text-forest-light'}`}
                >
                  {currentDateTime.date} {currentDateTime.hour.toString().padStart(2, '0')}:00
                </div>
              </div>
              <div className="flex items-center gap-2">{headerActions}</div>
            </div>
          </div>

          <div
            className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'}`}
          >
            {panelContent}
          </div>
        </div>
      </div>
    );
  }

  // Original ThemedPanel implementation for backward compatibility
  return (
    <div
      style={{
        position: 'fixed',
        top: isExpanded ? '28.125rem' : '1.25rem',
        right: '1.25rem',
        width: isExpanded ? 'clamp(20rem,30vw,35rem)' : '3rem',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <ThemedPanel
        title="Area Statistics"
        subtitle={`${currentDateTime.date} ${currentDateTime.hour.toString().padStart(2, '0')}:00`}
        headerActions={headerActions}
        icon={BarChart2}
        isExpanded={isExpanded}
        onClose={handleToggleExpand}
        isDarkMode={isDarkMode}
        order={1}
      >
        {panelContent}
      </ThemedPanel>
    </div>
  );
};

export default AreaAnalysis;
