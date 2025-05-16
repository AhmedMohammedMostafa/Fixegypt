import winston from 'winston';
import config from '../../../config.js';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = config.server.nodeEnv || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : config.logging.level || 'info';
};

// Define the custom settings for each transport
const options = {
  file: {
    level: level(),
    filename: './logs/app.log',
    handleExceptions: true,
    maxsize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  },
  console: {
    level: level(),
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}${
          info.splat !== undefined ? `${info.splat}` : ''
        }${
          info.stack !== undefined ? `\n${info.stack}` : ''
        }`
      )
    )
  }
};

// Create the transports array
const transports = [];

// Add console transport in all environments
transports.push(new winston.transports.Console(options.console));

// Add file transport if enabled in config
if (config.logging.file) {
  transports.push(new winston.transports.File(options.file));
}

// Instantiate a new Winston logger with the settings defined above
const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.metadata({
      fillExcept: ['timestamp', 'service', 'level', 'message']
    }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fixegypt-api' },
  transports,
  exitOnError: false // Do not exit on handled exceptions
});

// Log initialization
logger.info(`Logger initialized at level: ${level()}`);
logger.debug('Debug logging is enabled');

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

export default logger; 