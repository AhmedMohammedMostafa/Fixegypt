/**
 * Custom error class for API errors
 * Extends Error class with status code and additional data
 */
class ApiError extends Error {
  /**
   * Create a new API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} data - Additional error data (optional)
   */
  constructor(statusCode, message, data = {}) {
    super(message);
    this.statusCode = statusCode || 500;
    this.data = data;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError; 