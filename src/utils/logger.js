import React from 'react';

/**
 * Comprehensive Error Logging System
 * Provides structured logging with different severity levels and error tracking
 */

// Log levels with priorities
export const LOG_LEVELS = {
  ERROR: { priority: 0, label: 'ERROR', color: '#dc2626' },
  WARN: { priority: 1, label: 'WARN', color: '#d97706' },
  INFO: { priority: 2, label: 'INFO', color: '#2563eb' },
  DEBUG: { priority: 3, label: 'DEBUG', color: '#059669' },
  TRACE: { priority: 4, label: 'TRACE', color: '#6b7280' }
};

// Error categories for better organization
export const ERROR_CATEGORIES = {
  MAP: 'MAP',
  API: 'API',
  UI: 'UI',
  DATA: 'DATA',
  AUTH: 'AUTH',
  NETWORK: 'NETWORK',
  PERFORMANCE: 'PERFORMANCE',
  VALIDATION: 'VALIDATION'
};

class Logger {
  constructor() {
    this.level = this.getLogLevel();
    this.enableConsole = process.env.NODE_ENV === 'development';
    this.enableRemote = process.env.REACT_APP_ENABLE_REMOTE_LOGGING === 'true';
    this.remoteEndpoint = process.env.REACT_APP_LOG_ENDPOINT;
    this.sessionId = this.generateSessionId();
    this.errorBuffer = [];
    this.maxBufferSize = 100;

    // Performance monitoring
    this.performanceMetrics = new Map();

    // Initialize error handlers
    this.initializeErrorHandlers();
  }

  /**
   * Determine current log level from environment
   */
  getLogLevel() {
    const envLevel = process.env.REACT_APP_LOG_LEVEL || 'INFO';
    return LOG_LEVELS[envLevel.toUpperCase()] || LOG_LEVELS.INFO;
  }

  /**
   * Generate unique session ID for tracking
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize global error handlers
   */
  initializeErrorHandlers() {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled JavaScript Error', {
        category: ERROR_CATEGORIES.UI,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        category: ERROR_CATEGORIES.API,
        reason: event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // React error boundary fallback
    window.__LOGGER_ERROR_BOUNDARY__ = (error, errorInfo) => {
      this.error('React Error Boundary', {
        category: ERROR_CATEGORIES.UI,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    };
  }

  /**
   * Check if message should be logged based on current level
   */
  shouldLog(level) {
    return level.priority <= this.level.priority;
  }

  /**
   * Format log message with metadata
   */
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const sessionInfo = {
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp
    };

    return {
      level: level.label,
      message,
      data,
      session: sessionInfo,
      ...data
    };
  }

  /**
   * Send log to console with styling
   */
  logToConsole(level, formattedMessage) {
    if (!this.enableConsole) return;

    const style = `color: ${level.color}; font-weight: bold;`;
    const timestamp = new Date().toLocaleTimeString();

    console.groupCollapsed(
      `%c[${level.label}] ${timestamp} ${formattedMessage.message}`,
      style
    );

    if (formattedMessage.data && Object.keys(formattedMessage.data).length > 0) {
      console.log('Data:', formattedMessage.data);
    }

    if (formattedMessage.stack) {
      console.log('Stack:', formattedMessage.stack);
    }

    console.log('Session:', formattedMessage.session);
    console.groupEnd();
  }

  /**
   * Send log to remote endpoint
   */
  async logToRemote(formattedMessage) {
    if (!this.enableRemote || !this.remoteEndpoint) return;

    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedMessage)
      });
    } catch (error) {
      // Fail silently for remote logging to avoid infinite loops
      console.warn('Failed to send log to remote endpoint:', error.message);
    }
  }

  /**
   * Add log to error buffer for debugging
   */
  addToBuffer(formattedMessage) {
    this.errorBuffer.push(formattedMessage);

    // Keep buffer size manageable
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift();
    }
  }

  /**
   * Core logging method
   */
  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    this.logToConsole(level, formattedMessage);
    this.logToRemote(formattedMessage);
    this.addToBuffer(formattedMessage);

    return formattedMessage;
  }

  /**
   * Error logging with automatic error object parsing
   */
  error(message, data = {}) {
    // Handle Error objects
    if (data instanceof Error) {
      data = {
        message: data.message,
        stack: data.stack,
        name: data.name
      };
    }

    return this.log(LOG_LEVELS.ERROR, message, {
      category: ERROR_CATEGORIES.UI,
      ...data
    });
  }

  /**
   * Warning logging
   */
  warn(message, data = {}) {
    return this.log(LOG_LEVELS.WARN, message, data);
  }

  /**
   * Info logging
   */
  info(message, data = {}) {
    return this.log(LOG_LEVELS.INFO, message, data);
  }

  /**
   * Debug logging
   */
  debug(message, data = {}) {
    return this.log(LOG_LEVELS.DEBUG, message, data);
  }

  /**
   * Trace logging
   */
  trace(message, data = {}) {
    return this.log(LOG_LEVELS.TRACE, message, data);
  }

  /**
   * Map-specific error logging
   */
  mapError(message, data = {}) {
    return this.error(message, {
      category: ERROR_CATEGORIES.MAP,
      ...data
    });
  }

  /**
   * API-specific error logging
   */
  apiError(message, data = {}) {
    return this.error(message, {
      category: ERROR_CATEGORIES.API,
      ...data
    });
  }

  /**
   * Network error logging
   */
  networkError(message, data = {}) {
    return this.error(message, {
      category: ERROR_CATEGORIES.NETWORK,
      ...data
    });
  }

  /**
   * Performance logging
   */
  performance(operation, duration, data = {}) {
    const perfData = {
      operation,
      duration,
      category: ERROR_CATEGORIES.PERFORMANCE,
      ...data
    };

    this.performanceMetrics.set(operation, {
      ...perfData,
      timestamp: Date.now()
    });

    if (duration > 1000) { // Log slow operations
      this.warn(`Slow operation detected: ${operation}`, perfData);
    } else {
      this.debug(`Performance: ${operation}`, perfData);
    }

    return perfData;
  }

  /**
   * Start performance timer
   */
  startTimer(operation) {
    // Capture start time in closure to avoid incorrect `this` reference
    const startTime = performance.now();

    return {
      operation,
      end: () => {
        const duration = performance.now() - startTime;
        return this.performance(operation, duration);
      }
    };
  }

  /**
   * Validation error logging
   */
  validationError(field, value, expectedType, data = {}) {
    return this.error(`Validation failed for ${field}`, {
      category: ERROR_CATEGORIES.VALIDATION,
      field,
      value,
      expectedType,
      ...data
    });
  }

  /**
   * Get recent error logs
   */
  getRecentErrors(count = 10) {
    return this.errorBuffer
      .filter(log => log.level === 'ERROR')
      .slice(-count);
  }

  /**
   * Get all logs from buffer
   */
  getAllLogs() {
    return [...this.errorBuffer];
  }

  /**
   * Clear log buffer
   */
  clearBuffer() {
    this.errorBuffer = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    const logData = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      logs: this.getAllLogs(),
      performance: Array.from(this.performanceMetrics.entries()),
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        nodeEnv: process.env.NODE_ENV,
        logLevel: this.level.label
      }
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${this.sessionId}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Create child logger with context
   */
  createChildLogger(context) {
    return {
      error: (message, data = {}) => this.error(message, { ...data, context }),
      warn: (message, data = {}) => this.warn(message, { ...data, context }),
      info: (message, data = {}) => this.info(message, { ...data, context }),
      debug: (message, data = {}) => this.debug(message, { ...data, context }),
      trace: (message, data = {}) => this.trace(message, { ...data, context })
    };
  }
}

// Create singleton instance
const logger = new Logger();

// Make logger available globally for debugging
if (typeof window !== 'undefined') {
  window.logger = logger;
}

// Export both the instance and class for flexibility
export default logger;
export { Logger };

// Helper function for creating component-specific loggers
export const createLogger = (componentName) => {
  return logger.createChildLogger({ component: componentName });
};

// Error boundary HOC
export const withErrorLogging = (WrappedComponent, componentName) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
      this.logger = createLogger(componentName);
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      this.logger.error('Component Error Boundary', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });

      // Call global error handler
      if (window.__LOGGER_ERROR_BOUNDARY__) {
        window.__LOGGER_ERROR_BOUNDARY__(error, errorInfo);
      }
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="error-boundary p-4 bg-red-50 border border-red-200 rounded">
            <h2 className="text-red-800 font-semibold">Something went wrong</h2>
            <p className="text-red-600 text-sm mt-2">
              An error occurred in {componentName}. Please refresh the page or contact support.
            </p>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};
