import { useCallback, useEffect, useRef } from 'react';
import logger from '../utils/logger';

/**
 * React hook for component-specific logging
 * Provides scoped logging functions and automatic cleanup
 */
export const useLogger = (componentName, options = {}) => {
  const {
    enablePerformanceTracking = true,
    autoLogMounts = process.env.NODE_ENV === 'development',
    context = {}
  } = options;

  const componentLogger = useRef(null);
  const performanceTimers = useRef(new Map());

  // Initialize component logger on first render
  useEffect(() => {
    componentLogger.current = logger.createChildLogger({
      component: componentName,
      ...context
    });

    if (autoLogMounts) {
      componentLogger.current.debug(`${componentName} mounted`);
    }

    return () => {
      if (autoLogMounts) {
        componentLogger.current.debug(`${componentName} unmounted`);
      }

      // Clear any running performance timers
      performanceTimers.current.clear();
    };
  }, [componentName, autoLogMounts]);

  // Scoped logging functions
  const logError = useCallback((message, data = {}) => {
    return componentLogger.current?.error(message, data);
  }, []);

  const logWarn = useCallback((message, data = {}) => {
    return componentLogger.current?.warn(message, data);
  }, []);

  const logInfo = useCallback((message, data = {}) => {
    return componentLogger.current?.info(message, data);
  }, []);

  const logDebug = useCallback((message, data = {}) => {
    return componentLogger.current?.debug(message, data);
  }, []);

  const logTrace = useCallback((message, data = {}) => {
    return componentLogger.current?.trace(message, data);
  }, []);

  // Specialized logging functions
  const logMapError = useCallback((message, data = {}) => {
    return logger.mapError(message, {
      component: componentName,
      ...context,
      ...data
    });
  }, [componentName, context]);

  const logApiError = useCallback((message, data = {}) => {
    return logger.apiError(message, {
      component: componentName,
      ...context,
      ...data
    });
  }, [componentName, context]);

  const logNetworkError = useCallback((message, data = {}) => {
    return logger.networkError(message, {
      component: componentName,
      ...context,
      ...data
    });
  }, [componentName, context]);

  const logValidationError = useCallback((field, value, expectedType, data = {}) => {
    return logger.validationError(field, value, expectedType, {
      component: componentName,
      ...context,
      ...data
    });
  }, [componentName, context]);

  // Performance tracking
  const startPerformanceTimer = useCallback((operation) => {
    if (!enablePerformanceTracking) return null;

    const timer = {
      operation,
      startTime: performance.now(),
      end: () => {
        const duration = performance.now() - timer.startTime;
        performanceTimers.current.delete(operation);

        return logger.performance(`${componentName}.${operation}`, duration, {
          component: componentName,
          ...context
        });
      }
    };

    performanceTimers.current.set(operation, timer);
    return timer;
  }, [componentName, enablePerformanceTracking, context]);

  const endPerformanceTimer = useCallback((operation) => {
    const timer = performanceTimers.current.get(operation);
    if (timer) {
      return timer.end();
    }
    return null;
  }, []);

  // Async operation logging with automatic error handling
  const logAsyncOperation = useCallback(async (operation, asyncFn, data = {}) => {
    const timer = startPerformanceTimer(operation);

    try {
      logDebug(`Starting ${operation}`, data);
      const result = await asyncFn();

      const perfData = timer?.end();
      logDebug(`Completed ${operation}`, { ...data, performance: perfData });

      return result;
    } catch (error) {
      timer?.end();
      logError(`Failed ${operation}`, {
        ...data,
        error: error.message,
        stack: error.stack
      });
      throw error; // Re-throw to maintain error flow
    }
  }, [startPerformanceTimer, logDebug, logError]);

  // State change logging
  const logStateChange = useCallback((stateName, oldValue, newValue, data = {}) => {
    logDebug(`State change: ${stateName}`, {
      stateName,
      oldValue,
      newValue,
      ...data
    });
  }, [logDebug]);

  // Effect logging
  const logEffect = useCallback((effectName, dependencies = [], data = {}) => {
    logTrace(`Effect triggered: ${effectName}`, {
      effectName,
      dependencies,
      ...data
    });
  }, [logTrace]);

  // User interaction logging
  const logUserInteraction = useCallback((action, target, data = {}) => {
    logInfo(`User interaction: ${action}`, {
      action,
      target,
      timestamp: new Date().toISOString(),
      ...data
    });
  }, [logInfo]);

  // API call logging
  const logApiCall = useCallback(async (endpoint, options = {}, data = {}) => {
    const operationName = `API.${endpoint.split('/').pop()}`;
    const timer = startPerformanceTimer(operationName);

    try {
      logDebug(`API call started: ${endpoint}`, { endpoint, options, ...data });

      const response = await fetch(endpoint, options);
      const perfData = timer?.end();

      if (!response.ok) {
        logApiError(`API call failed: ${endpoint}`, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          performance: perfData,
          ...data
        });
      } else {
        logDebug(`API call completed: ${endpoint}`, {
          endpoint,
          status: response.status,
          performance: perfData,
          ...data
        });
      }

      return response;
    } catch (error) {
      timer?.end();
      logNetworkError(`API call error: ${endpoint}`, {
        endpoint,
        error: error.message,
        ...data
      });
      throw error;
    }
  }, [startPerformanceTimer, logDebug, logApiError, logNetworkError]);

  // Return logging interface
  return {
    // Basic logging
    error: logError,
    warn: logWarn,
    info: logInfo,
    debug: logDebug,
    trace: logTrace,

    // Specialized logging
    mapError: logMapError,
    apiError: logApiError,
    networkError: logNetworkError,
    validationError: logValidationError,

    // Performance tracking
    startTimer: startPerformanceTimer,
    endTimer: endPerformanceTimer,

    // Higher-level logging utilities
    logAsync: logAsyncOperation,
    logStateChange,
    logEffect,
    logUserInteraction,
    logApiCall,

    // Direct access to logger for advanced usage
    logger: componentLogger.current
  };
};

// Hook for error boundary integration
export const useErrorHandler = (componentName) => {
  const { error } = useLogger(componentName);

  return useCallback((error, errorInfo = {}) => {
    error('Component error caught', {
      error: error.message,
      stack: error.stack,
      ...errorInfo
    });
  }, [error]);
};

// Hook for debugging component renders
export const useRenderLogger = (componentName, props = {}) => {
  const { debug } = useLogger(componentName);
  const renderCount = useRef(0);
  const previousProps = useRef();

  useEffect(() => {
    renderCount.current += 1;

    debug(`Render #${renderCount.current}`, {
      props,
      propsChanged: JSON.stringify(props) !== JSON.stringify(previousProps.current)
    });

    previousProps.current = props;
  });

  return renderCount.current;
};
