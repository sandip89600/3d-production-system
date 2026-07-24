const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDirectory = path.join(process.cwd(), 'logs');

// Define format elements
const { combine, timestamp, json, colorize, printf, errors } = winston.format;

// Custom console format for clean developer reading
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${stack ? `\n${stack}` : ''}${metaString}`;
  })
);

// Daily Rotate File options template
const rotateOptions = (filename, level) => ({
  dirname: logDirectory,
  filename: `${filename}-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  )
});

// Create Winston Logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Error Logs Rotate File
    new winston.transports.DailyRotateFile(rotateOptions('error', 'error')),
    // Access/General Logs Rotate File (info and below)
    new winston.transports.DailyRotateFile(rotateOptions('access', 'info')),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Dedicated security logger transport
const securityLogger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.DailyRotateFile(rotateOptions('security', 'info'))
  ]
});

// In development, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
  securityLogger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
} else {
  // Production console fallback in JSON format
  logger.add(new winston.transports.Console({
    format: combine(timestamp(), json())
  }));
  securityLogger.add(new winston.transports.Console({
    format: combine(timestamp(), json())
  }));
}

// Helper methods for structured logs
const logSecurity = (message, meta = {}) => {
  securityLogger.info(message, { ...meta, tags: ['security'] });
};

module.exports = {
  logger,
  logSecurity,
  securityLogger
};
