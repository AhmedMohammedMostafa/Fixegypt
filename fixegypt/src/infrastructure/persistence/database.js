import mongoose from 'mongoose';
import config from '../../config.js';
import logger from '../web/middlewares/logger.js';

// Configure mongoose
mongoose.set('strictQuery', true);

// Explicitly configure toJSON and toObject transformations to avoid undefined errors
mongoose.set('toJSON', {
  virtuals: true,
  transform: (doc, converted) => {
    if (converted._id) delete converted._id;
    if (converted.__v !== undefined) delete converted.__v;
    return converted;
  },
  getters: true,
  versionKey: false,
  _defaultToObjectOptions: { virtuals: true, versionKey: false }
});

mongoose.set('toObject', {
  virtuals: true,
  transform: (doc, converted) => {
    if (converted._id) delete converted._id;
    if (converted.__v !== undefined) delete converted.__v;
    return converted;
  },
  getters: true,
  versionKey: false,
  _defaultToObjectOptions: { virtuals: true, versionKey: false }
});

// Handle mongoose errors globally
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

const connectDB = async () => {
  try {
    logger.debug('Connecting to MongoDB...');
    const dbUri = process.env.NODE_ENV === 'test' ? config.database.testUri : config.database.uri;
    logger.debug(`Using database URI: ${dbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Mask credentials in logs
    
    // Explicit MongoDB driver options
    const options = {
      autoIndex: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, avoid issues with IPv6
      retryWrites: true,
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 120000
    };
    
    const conn = await mongoose.connect(dbUri, options);

    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.debug(`MongoDB Database Name: ${conn.connection.name}`);
    logger.debug(`MongoDB Connection State: ${conn.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
    
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    logger.debug(`MongoDB Connection Error Details: ${error.stack}`);
    
    // Provide more detailed error information
    if (error.name === 'MongoServerSelectionError') {
      logger.error('Could not connect to any MongoDB servers. Please check your connection string and ensure MongoDB is running.');
    } else if (error.name === 'MongoParseError') {
      logger.error('Invalid MongoDB connection string. Please check your database URI format.');
    }
    
    // Don't exit the process in production, let the application handle reconnection
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Database connection failed but application will continue to run and retry connection');
      return null;
    } else {
      process.exit(1);
    }
  }
};

export default connectDB; 