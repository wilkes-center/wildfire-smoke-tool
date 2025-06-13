import React, { useCallback, useEffect, useState } from 'react';

import logger, { ERROR_CATEGORIES, LOG_LEVELS } from '../../utils/logger';

const DebugDashboard = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState({});

  // Refresh logs
  const refreshLogs = useCallback(() => {
    const allLogs = logger.getAllLogs();
    setLogs(allLogs);

    // Calculate stats
    const newStats = {
      total: allLogs.length,
      errors: allLogs.filter(log => log.level === 'ERROR').length,
      warnings: allLogs.filter(log => log.level === 'WARN').length,
      byCategory: {}
    };

    Object.values(ERROR_CATEGORIES).forEach(category => {
      newStats.byCategory[category] = allLogs.filter(log => log.data.category === category).length;
    });

    setStats(newStats);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(refreshLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isOpen, refreshLogs]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen, refreshLogs]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'ALL' || log.level === filterLevel;
    const categoryMatch = filterCategory === 'ALL' || log.data.category === filterCategory;
    const searchMatch =
      searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase());

    return levelMatch && categoryMatch && searchMatch;
  });

  // Export logs
  const handleExportLogs = () => {
    logger.exportLogs();
  };

  // Clear logs
  const handleClearLogs = () => {
    logger.clearBuffer();
    refreshLogs();
  };

  // Get level color
  const getLevelColor = level => {
    const levelInfo = LOG_LEVELS[level];
    return levelInfo ? levelInfo.color : '#6b7280';
  };

  // Format timestamp
  const formatTimestamp = timestamp => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Debug Dashboard</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <button
              onClick={refreshLogs}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={handleExportLogs}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Logs:</span> {stats.total}
            </div>
            <div>
              <span className="font-medium text-red-600">Errors:</span> {stats.errors}
            </div>
            <div>
              <span className="font-medium text-yellow-600">Warnings:</span> {stats.warnings}
            </div>
            <div>
              <span className="font-medium">Session:</span> {logger.sessionId?.slice(-8)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level Filter</label>
              <select
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1"
              >
                <option value="ALL">All Levels</option>
                {Object.keys(LOG_LEVELS).map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Filter
              </label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1"
              >
                <option value="ALL">All Categories</option>
                {Object.values(ERROR_CATEGORIES).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full border border-gray-300 rounded px-3 py-1"
              />
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No logs match the current filters</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log, index) => (
                <LogEntry
                  key={index}
                  log={log}
                  getLevelColor={getLevelColor}
                  formatTimestamp={formatTimestamp}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual log entry component
const LogEntry = React.memo(({ log, getLevelColor, formatTimestamp }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 hover:bg-gray-50">
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: getLevelColor(log.level) }}
            />
            <span className="font-medium text-sm" style={{ color: getLevelColor(log.level) }}>
              {log.level}
            </span>
            {log.data.category && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {log.data.category}
              </span>
            )}
            {log.data.component && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {log.data.component}
              </span>
            )}
            <span className="text-gray-500 text-sm">{formatTimestamp(log.session.timestamp)}</span>
          </div>
          <div className="mt-1 text-gray-900 font-medium">{log.message}</div>
          {log.data.error && (
            <div className="mt-1 text-red-600 text-sm">Error: {log.data.error}</div>
          )}
        </div>
        <button className="text-gray-400 hover:text-gray-600">{isExpanded ? '−' : '+'}</button>
      </div>

      {isExpanded && (
        <div className="mt-4 pl-6 border-l-2 border-gray-200">
          <div className="space-y-2 text-sm">
            {log.data && Object.keys(log.data).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700">Data:</h4>
                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            )}
            {log.data.stack && (
              <div>
                <h4 className="font-medium text-gray-700">Stack Trace:</h4>
                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {log.data.stack}
                </pre>
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-700">Session Info:</h4>
              <div className="mt-1 text-xs text-gray-600">
                <div>Session ID: {log.session.sessionId}</div>
                <div>URL: {log.session.url}</div>
                <div>User Agent: {log.session.userAgent}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DebugDashboard;
