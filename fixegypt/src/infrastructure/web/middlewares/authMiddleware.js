import authService from '../../../domain/services/AuthService.js';
import { ApiError } from './errorHandler.js';
import config from '../../../config.js';

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = authService.verifyToken(token, config.jwt.secret);
    
    // Attach user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

/**
 * Middleware to restrict access based on user role
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware function
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied. You do not have permission to access this resource'));
    }
    
    next();
  };
};

/**
 * Middleware to verify user is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated'));
  }
  
  if (!req.user.isVerified) {
    return next(new ApiError(403, 'Account verification required'));
  }
  
  next();
};

/**
 * Middleware to verify user owns the resource or is admin
 * @param {string} paramName - Name of route parameter containing resource ID
 * @param {Function} getOwnerId - Function to get owner ID from resource
 * @returns {Function} Middleware function
 */
const authorizeResourceAccess = (paramName, getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }
      
      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }
      
      const resourceId = req.params[paramName];
      if (!resourceId) {
        throw new ApiError(400, 'Resource ID not provided');
      }
      
      // Get owner ID from resource using the provided function
      const ownerId = await getOwnerId(resourceId);
      
      if (!ownerId) {
        throw new ApiError(404, 'Resource not found');
      }
      
      // Check if user is the owner
      if (ownerId.toString() !== req.user.id) {
        throw new ApiError(403, 'Access denied. You do not own this resource');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Create an object for default export
const authMiddleware = { 
  protect, 
  restrictTo, 
  requireVerified, 
  authorizeResourceAccess,
  // Add alias for verificationRequired to maintain naming consistency with route usage
  verificationRequired: requireVerified
};

export default authMiddleware;
export { protect, restrictTo, requireVerified, authorizeResourceAccess }; 