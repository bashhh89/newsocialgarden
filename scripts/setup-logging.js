/**
 * Centralized Logging Setup Script
 * 
 * This script configures a robust logging system for the application using Winston.
 * It provides structured logging with different log levels and formats for development and production.
 */

const winston = require('winston');
const { format } = winston;
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels with custom colors
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'gray'
  }
};

// Add colors to Winston
winston.addColors(customLevels.colors);

// Custom format for structured logging
const structuredFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Human-readable format for console
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, ...rest }) => {
    const restString = Object.keys(rest).length ? JSON.stringify(rest, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${restString}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: { service: 'social-garden-scorecard' },
  transports: [
    // Write errors to error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    // Write API logs to api.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'api.log'),
      level: 'http',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // PDF generation specific logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'pdf-generation.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ]
});

// Add console transport for development environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
} else {
  // In production, only log warnings and errors to console
  logger.add(new winston.transports.Console({
    level: 'warn',
    format: consoleFormat
  }));
}

// HTTP request logging middleware for Express
const expressLogger = (req, res, next) => {
  // Don't log health checks to avoid log spam
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  const startTime = new Date();
  
  // Once response is finished
  res.on('finish', () => {
    const duration = new Date() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'] || '',
      ip: req.headers['x-forwarded-for'] || req.ip
    };

    // Log at different levels based on status code
    if (res.statusCode >= 500) {
      logger.error('Server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.http('Request completed', logData);
    }
  });

  next();
};

// Export logger and middleware
module.exports = {
  logger,
  expressLogger,
  
  // Function to create a child logger for specific components
  createChildLogger: (component) => {
    return logger.child({ component });
  },
  
  // Function to create a PDF generation logger
  createPdfLogger: () => {
    return logger.child({ component: 'pdf-generation' });
  },
  
  // Function to log API calls with rate limit tracking
  logApiCall: (api, endpoint, success, rateLimit = null) => {
    const logData = {
      api,
      endpoint,
      success,
    };
    
    if (rateLimit) {
      logData.rateLimit = rateLimit;
    }
    
    if (success) {
      logger.http('API call successful', logData);
    } else {
      logger.warn('API call failed', logData);
    }
  }
}; 