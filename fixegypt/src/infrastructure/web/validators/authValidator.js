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

// Registration validation schema
const registerSchema = Joi.object({
  nationalId: Joi.string().required().length(14).pattern(/^\d+$/)
    .messages({
      'string.base': 'National ID should be a string',
      'string.empty': 'National ID is required',
      'string.length': 'National ID must be exactly 14 digits',
      'string.pattern.base': 'National ID must contain only digits',
      'any.required': 'National ID is required'
    }),
  firstName: Joi.string().required().min(2).max(50)
    .messages({
      'string.base': 'First name should be a string',
      'string.empty': 'First name is required',
      'string.min': 'First name should have at least {#limit} characters',
      'string.max': 'First name should have at most {#limit} characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string().required().min(2).max(50)
    .messages({
      'string.base': 'Last name should be a string',
      'string.empty': 'Last name is required',
      'string.min': 'Last name should have at least {#limit} characters',
      'string.max': 'Last name should have at most {#limit} characters',
      'any.required': 'Last name is required'
    }),
  email: Joi.string().required().email()
    .messages({
      'string.base': 'Email should be a string',
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().required().min(6).max(30)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.base': 'Password should be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password should have at least {#limit} characters',
      'string.max': 'Password should have at most {#limit} characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  phone: Joi.string().required().pattern(/^01[0-2|5]{1}[0-9]{8}$/)
    .messages({
      'string.base': 'Phone number should be a string',
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must be a valid Egyptian mobile number (e.g., 01012345678)',
      'any.required': 'Phone number is required'
    }),
  address: Joi.string().min(5).max(200)
    .messages({
      'string.base': 'Address should be a string',
      'string.min': 'Address should have at least {#limit} characters',
      'string.max': 'Address should have at most {#limit} characters'
    }),
  city: Joi.string().min(2).max(50)
    .messages({
      'string.base': 'City should be a string',
      'string.min': 'City should have at least {#limit} characters',
      'string.max': 'City should have at most {#limit} characters'
    }),
  governorate: Joi.string().min(2).max(50)
    .messages({
      'string.base': 'Governorate should be a string',
      'string.min': 'Governorate should have at least {#limit} characters',
      'string.max': 'Governorate should have at most {#limit} characters'
    })
});

// Login validation schema
const loginSchema = Joi.object({
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

// Refresh token validation schema
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
    .messages({
      'string.base': 'Refresh token should be a string',
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required'
    })
});

// Reset password validation schema
const resetPasswordSchema = Joi.object({
  password: Joi.string().required().min(6).max(30)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.base': 'Password should be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password should have at least {#limit} characters',
      'string.max': 'Password should have at most {#limit} characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    })
});

// Export validation middlewares
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateRefreshToken = validate(refreshTokenSchema);
export const validateResetPassword = validate(resetPasswordSchema); 