const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [];

// Console transport
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transports with rotation
const fileRotateTransport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format,
});

const errorFileRotateTransport = new DailyRotateFile({
  level: 'error',
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format,
});

transports.push(fileRotateTransport);
transports.push(errorFileRotateTransport);

// Elasticsearch transport for production
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  const esTransport = new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL,
    },
    index: 'runfitting-logs',
  });
  
  transports.push(esTransport);
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Add request logging
logger.requestLogger = (req) => {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  };
  
  logger.http('Incoming request', logData);
};

// Add error logging with context
logger.errorWithContext = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...context,
  };
  
  logger.error('Application error', errorData);
};

// Add performance logging
logger.performance = (operation, duration, metadata = {}) => {
  const perfData = {
    operation,
    duration,
    ...metadata,
  };
  
  logger.info('Performance metric', perfData);
};

// Add security event logging
logger.security = (event, details = {}) => {
  const securityData = {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  logger.warn('Security event', securityData);
};

// Add business event logging
logger.business = (event, data = {}) => {
  const businessData = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  logger.info('Business event', businessData);
};

module.exports = logger;