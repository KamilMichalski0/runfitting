const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Konfiguracja connection pooling dla wysokiego obciążenia
const connectDB = async () => {
  try {
    // Optymalizacja dla 1000+ concurrent users
    const mongoOptions = {
      // Connection pool settings
      maxPoolSize: 50, // Maximum number of connections in the pool
      minPoolSize: 5,  // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      
      // Timeout settings
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a socket to stay open
      connectTimeoutMS: 10000, // How long to wait for initial connection
      
      // Heartbeat settings
      heartbeatFrequencyMS: 10000, // How often to check server status
      
      // Buffer settings
      bufferCommands: false, // Disable mongoose buffering
      
      // Write concern for better performance
      writeConcern: {
        w: 'majority',
        j: true, // Wait for journal
        wtimeout: 1000 // Write timeout
      },
      
      // Read preference for load balancing
      readPreference: 'primary',
      
      // Connection management
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Compression for better network performance
      compressors: ['zlib']
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, mongoOptions);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    // Log connection pool stats periodically
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        try {
          const stats = mongoose.connection.readyState;
          logger.info(`MongoDB Connection Status: ${stats}`);
        } catch (err) {
          logger.error('Failed to get MongoDB stats:', err);
        }
      }, 30000);
    }

    return conn;
  } catch (error) {
    logger.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB
}; 