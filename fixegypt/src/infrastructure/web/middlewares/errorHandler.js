import logger from './logger.js';
import ApiError from '../../../application/errors/ApiError.js';
import mongoose from 'mongoose';

const errorHandler = (err, req, res, next) => {
  // Log detailed error information
  logger.error(`Error processing request: ${req.method} ${req.originalUrl}`);
  
  // Add specific logging for database errors
  if (err instanceof mongoose.Error) {
    logger.error(`Mongoose error type: ${err.constructor.name}`);
    logger.debug(`Mongoose error details: ${JSON.stringify(err)}`);
    
    if (err instanceof mongoose.Error.ValidationError) {
      // Handle validation errors
      const validationErrors = Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message,
        value: error.value
      }));
      logger.debug(`Validation errors: ${JSON.stringify(validationErrors)}`);
    }
  }
  
  // Log more details for debugging
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  logger.debug(`Request query: ${JSON.stringify(req.query)}`);
  logger.debug(`Request params: ${JSON.stringify(req.params)}`);
  
  // Log error stack
  logger.debug(`Error stack: ${err.stack}`);
  
  // If it's not an ApiError, convert it to one
  if (!(err instanceof ApiError)) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Create special message for known error types
    if (err instanceof mongoose.Error.ValidationError) {
      err = new ApiError(400, 'Validation Error', { 
        stack: err.stack,
        errors: Object.values(err.errors).map(e => ({ 
          field: e.path, 
          message: e.message 
        }))
      });
    } else if (err instanceof mongoose.Error.CastError) {
      err = new ApiError(400, `Invalid ${err.path}: ${err.value}`, { stack: err.stack });
    } else if (err.name === 'MongoServerError' && err.code === 11000) {
      // Handle duplicate key errors
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      err = new ApiError(409, `Duplicate value: ${field} already exists with value: ${value}`, { stack: err.stack });
    } else {
      err = new ApiError(statusCode, message, { stack: err.stack });
    }
  }

  // Final response format
  const response = {
    status: 'error',
    statusCode: err.statusCode,
    message: err.message,
  };

  // Add details for client-facing errors
  if (err.errors) {
    response.errors = err.errors;
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Log the final error summary
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  // Send response
  return res.status(err.statusCode || 500).json(response);
};

// Catch 404 and forward to error handler
const notFound = (req, res, next) => {
  logger.debug(`Not Found: ${req.method} ${req.originalUrl}`);
  const err = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(err);
};

export { ApiError, errorHandler as default, notFound }; 