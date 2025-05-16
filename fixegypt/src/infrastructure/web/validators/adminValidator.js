import Joi from 'joi';
import { ApiError } from '../middlewares/errorHandler.js';

/**
 * Middleware for validating request data
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }

    next();
  };
};

// Admin login validation schema
const adminLoginSchema = Joi.object({
  email: Joi.string().required().email()
    .messages({
      'string.base': 'Email should be a string',
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().required()
    .messages({
      'string.base': 'Password should be a string',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

// Update report status validation schema
const statusUpdateSchema = Joi.object({
  status: Joi.string().required().valid('pending', 'in-progress', 'resolved', 'rejected')
    .messages({
      'string.base': 'Status should be a string',
      'string.empty': 'Status is required',
      'any.only': 'Status must be one of: pending, in-progress, resolved, rejected',
      'any.required': 'Status is required'
    }),
  note: Joi.string().allow('').max(500)
    .messages({
      'string.base': 'Note should be a string',
      'string.max': 'Note should have at most {#limit} characters'
    })
});

// User role update validation schema
const userRoleUpdateSchema = Joi.object({
  role: Joi.string().required().valid('citizen', 'admin', 'manager', 'analyst')
    .messages({
      'string.base': 'Role should be a string',
      'string.empty': 'Role is required',
      'any.only': 'Role must be one of: citizen, admin, manager, analyst',
      'any.required': 'Role is required'
    })
});

// Analytics filters validation schema
const analyticsFiltersSchema = Joi.object({
  type: Joi.string().required().valid(
    'resolution-time-category', 
    'resolution-time-area', 
    'trends', 
    'seasonal', 
    'agency-performance',
    'damage-assessment'
  )
    .messages({
      'string.base': 'Analytics type should be a string',
      'string.empty': 'Analytics type is required',
      'any.only': 'Analytics type must be one of the supported types',
      'any.required': 'Analytics type is required'
    }),
  timeUnit: Joi.string().valid('day', 'week', 'month').default('week')
    .messages({
      'string.base': 'Time unit should be a string',
      'any.only': 'Time unit must be one of: day, week, month'
    }),
  startDate: Joi.date().iso()
    .messages({
      'date.base': 'Start date should be a valid date',
      'date.format': 'Start date should be in ISO format (YYYY-MM-DD)'
    }),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
    .messages({
      'date.base': 'End date should be a valid date',
      'date.format': 'End date should be in ISO format (YYYY-MM-DD)',
      'date.min': 'End date should be equal to or after start date'
    }),
  category: Joi.string()
    .messages({
      'string.base': 'Category should be a string'
    }),
  governorate: Joi.string()
    .messages({
      'string.base': 'Governorate should be a string'
    })
});

// Export validation middlewares
export const validateAdminLogin = validate(adminLoginSchema);
export const validateStatusUpdate = validate(statusUpdateSchema);
export const validateUserRoleUpdate = validate(userRoleUpdateSchema);
export const validateAnalyticsFilters = validate(analyticsFiltersSchema); 