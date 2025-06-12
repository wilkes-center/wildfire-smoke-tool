# Error Logging System Integration Guide

## Overview

This comprehensive error logging system provides structured logging with different severity levels, error tracking, performance monitoring, and debugging capabilities for your React application.

## Features

- **Structured Logging**: Multiple log levels (ERROR, WARN, INFO, DEBUG, TRACE)
- **Error Categories**: Organized by MAP, API, UI, DATA, NETWORK, PERFORMANCE, VALIDATION
- **Performance Monitoring**: Automatic timing and slow operation detection
- **React Integration**: Custom hooks for component-specific logging
- **Debug Dashboard**: Visual interface for viewing and managing logs
- **Error Boundaries**: Automatic error catching and logging
- **Remote Logging**: Optional remote log transmission
- **Session Tracking**: Unique session IDs for debugging

## Quick Start

### 1. Environment Configuration

The logging system is already configured in your `.env` file:

```bash
# Logging Configuration
REACT_APP_LOG_LEVEL=DEBUG
REACT_APP_ENABLE_REMOTE_LOGGING=false
REACT_APP_ENABLE_CONSOLE_LOGGING=true
REACT_APP_ENABLE_PERFORMANCE_TRACKING=true
REACT_APP_ENABLE_AUTO_LOG_MOUNTS=true
```

### 2. Basic Usage in Components

Replace your existing console.log statements with structured logging:

**Before:**
```javascript
console.log('Layer initialization');
console.error('Failed to load data:', error);
```

**After:**
```javascript
import { useLogger } from '../hooks/useLogger';

const MyComponent = () => {
  const { debug, error } = useLogger('MyComponent');

  debug('Layer initialization');
  error('Failed to load data', { error: error.message });
};
```

### 3. Debug Dashboard

The debug dashboard is already integrated into your App component. Access it with:
- **Keyboard Shortcut**: `Ctrl + Shift + D` (in development mode)
- **Browser Console**: `window.logger.exportLogs()` to export logs

## Integration Examples

### Map Components

For map-related components, use specialized logging:

```javascript
import { useLogger } from '../hooks/useLogger';

const MapComponent = () => {
  const {
    debug,
    mapError,
    logAsync,
    startTimer,
    logUserInteraction
  } = useLogger('MapComponent');

  const loadMapData = async () => {
    return logAsync('loadMapData', async () => {
      const response = await fetch('/api/map-data');
      if (!response.ok) {
        throw new Error('Failed to load map data');
      }
      return response.json();
    });
  };

  const handleMapClick = (event) => {
    logUserInteraction('map_click', 'map_canvas', {
      coordinates: event.lngLat,
      zoom: map.getZoom()
    });
  };

  const handleMapError = (error) => {
    mapError('Map rendering error', {
      error: error.message,
      mapStyle: map.getStyle()?.name
    });
  };

  return (
    <Map
      onClick={handleMapClick}
      onError={handleMapError}
    />
  );
};
```

### API Calls

For API-related operations:

```javascript
const { logApiCall, apiError } = useLogger('ApiService');

const fetchData = async (endpoint) => {
  try {
    const response = await logApiCall(endpoint, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ...' }
    });
    return response.json();
  } catch (error) {
    // Error is automatically logged by logApiCall
    throw error;
  }
};
```

### Performance Monitoring

Track performance-critical operations:

```javascript
const { startTimer, logAsync } = useLogger('PerformanceComponent');

const processLargeDataset = async (data) => {
  return logAsync('processLargeDataset', async () => {
    // Heavy processing here
    const result = await heavyComputation(data);
    return result;
  });
};

// Or manual timing
const timer = startTimer('customOperation');
// ... do work ...
timer.end(); // Automatically logs performance
```

### State Changes

Log important state changes:

```javascript
const [currentHour, setCurrentHour] = useState(0);
const { logStateChange } = useLogger('TimelineComponent');

useEffect(() => {
  logStateChange('currentHour', prevHour, currentHour, {
    context: 'user interaction',
    timestamp: Date.now()
  });
}, [currentHour]);
```

## Error Boundaries

Wrap components with error boundaries for automatic error catching:

```javascript
import { withErrorLogging } from '../utils/logger';

const MyComponent = () => {
  // Component code that might throw errors
  return <div>My Component</div>;
};

export default withErrorLogging(MyComponent, 'MyComponent');
```

## Migrating Existing Code

### Step 1: Replace Console Statements

Use find/replace in your editor:
- `console.log` → `debug`
- `console.error` → `error`
- `console.warn` → `warn`

### Step 2: Add Context Data

Enhance your logging with structured data:

```javascript
// Before
console.log('Loading tileset:', tilesetId);

// After
debug('Loading tileset', {
  tilesetId,
  timestamp: Date.now(),
  mapZoom: map.getZoom()
});
```

### Step 3: Add Performance Monitoring

Wrap slow operations:

```javascript
// Before
const result = await heavyOperation();

// After
const result = await logAsync('heavyOperation', () => heavyOperation());
```

## Log Levels

Configure the appropriate log level for your environment:

- **ERROR**: Critical errors that break functionality
- **WARN**: Issues that don't break functionality but should be addressed
- **INFO**: General information about app behavior
- **DEBUG**: Detailed information for debugging (default for development)
- **TRACE**: Very detailed information for deep debugging

## Production Configuration

For production deployment, update your environment variables:

```bash
# Production settings
REACT_APP_LOG_LEVEL=WARN
REACT_APP_ENABLE_REMOTE_LOGGING=true
REACT_APP_LOG_ENDPOINT=https://your-logging-service.com/api/logs
REACT_APP_ENABLE_CONSOLE_LOGGING=false
```

## Remote Logging

To send logs to a remote service, implement an endpoint that accepts POST requests:

```javascript
// Example log data structure sent to remote endpoint
{
  "level": "ERROR",
  "message": "Map layer failed to load",
  "data": {
    "category": "MAP",
    "component": "useMapLayers",
    "error": "Network timeout",
    "layerId": "layer-chunk-1"
  },
  "session": {
    "sessionId": "1234567890-abc123",
    "url": "https://yourapp.com/map",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-06-12T10:30:00.000Z"
  }
}
```

## Debug Commands

Access these commands in the browser console:

```javascript
// Get recent errors
window.logger.getRecentErrors(5)

// Export all logs as JSON file
window.logger.exportLogs()

// Clear log buffer
window.logger.clearBuffer()

// Check current log level
window.logger.level

// Get performance metrics
Array.from(window.logger.performanceMetrics.entries())
```

## Example Integration: useMapLayers Hook

See `src/hooks/map/useMapLayersWithLogging.js` for a complete example of how to integrate logging into an existing hook. This example shows:

- Component-specific logger initialization
- Performance timing for operations
- Structured error handling
- State change logging
- Async operation logging
- Map-specific error categorization

## Best Practices

1. **Be Descriptive**: Use clear, specific error messages
2. **Include Context**: Add relevant data like IDs, coordinates, timestamps
3. **Use Appropriate Levels**: Don't log debug info as errors
4. **Monitor Performance**: Track slow operations automatically
5. **Structured Data**: Prefer structured data over string concatenation
6. **Component Context**: Always use component-specific loggers
7. **Error Handling**: Don't just log errors, handle them appropriately

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check your `REACT_APP_LOG_LEVEL` setting
2. **Too many logs**: Increase log level or add more specific filters
3. **Performance impact**: Disable console logging in production
4. **Remote logging fails**: Check network connectivity and endpoint URL

### Debug Dashboard Not Showing

- Ensure you're in development mode (`NODE_ENV=development`)
- Try the keyboard shortcut: `Ctrl + Shift + D`
- Check browser console for any JavaScript errors

### Logger Not Available

If you see "logger is not defined" errors:
- Ensure you're importing from the correct path: `import { useLogger } from '../hooks/useLogger'`
- Check that the logger utility is properly initialized

## Files Created/Modified

- ✅ `src/utils/logger.js` - Core logging utility
- ✅ `src/hooks/useLogger.js` - React hooks for logging
- ✅ `src/components/Debug/DebugDashboard.js` - Debug interface
- ✅ `src/hooks/map/useMapLayersWithLogging.js` - Example integration
- ✅ `src/App.js` - Debug dashboard integration
- ✅ `.env` - Environment configuration
- ✅ `.env.example` - Environment template

## Next Steps

1. **Gradual Migration**: Start with error-prone components (map hooks, API calls)
2. **Add Error Boundaries**: Wrap main application sections
3. **Monitor Performance**: Add timing to slow operations
4. **Remote Logging**: Set up remote endpoint for production logging
5. **Team Training**: Share this guide with your development team

The logging system is now fully integrated and ready to use. Start by replacing console statements in your most critical components and gradually expand coverage across your application.
