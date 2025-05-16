import compression from 'compression';

/**
 * Compression filter to decide whether to compress response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Boolean} Whether to compress response
 */
const compressionFilter = (req, res) => {
  // Don't compress responses with this header
  if (req.headers['x-no-compression']) {
    return false;
  }

  // Don't compress small responses
  if (res.getHeader('Content-Length') && 
      parseInt(res.getHeader('Content-Length')) < 1024) {
    return false;
  }

  // Otherwise, compress everything
  return compression.filter(req, res);
};

/**
 * Middleware for HTTP response compression
 * Compresses responses to reduce data transfer and improve load times
 */
const compressionMiddleware = compression({
  // Compression filter function
  filter: compressionFilter,
  
  // Compression level (0-9, where 9 is maximum compression)
  // Using 6 as good balance between CPU usage and compression ratio
  level: 6,
  
  // Minimum size in bytes to compress (don't compress very small responses)
  threshold: 1024, // 1KB
  
  // Set header whether response is compressed or not
  enableTrailingHeader: true,
  
  // Cache compressed responses to avoid recompression
  useCache: true,
  
  // Maximum size of compression cache entries
  cacheSize: 128 * 1024, // 128KB
  
  // Response content types to compress
  contentType: [
    'text/html',
    'text/plain',
    'text/css',
    'text/javascript',
    'text/markdown',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/xhtml+xml',
    'application/rss+xml',
    'application/atom+xml',
    'application/x-javascript',
    'application/x-www-form-urlencoded',
    'application/ld+json',
    'image/svg+xml',
    'font/ttf',
    'font/otf',
    'font/eot',
    'font/opentype'
  ]
});

// Export the middleware
export default compressionMiddleware; 