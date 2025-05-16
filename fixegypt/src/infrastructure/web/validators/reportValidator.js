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

// Create report validation schema
const createReportSchema = Joi.object({
  title: Joi.string().required().min(5).max(100)
    .messages({
      'string.base': 'Title should be a string',
      'string.empty': 'Title is required',
      'string.min': 'Title should have at least {#limit} characters',
      'string.max': 'Title should have at most {#limit} characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string().required().min(10).max(2000)
    .messages({
      'string.base': 'Description should be a string',
      'string.empty': 'Description is required',
      'string.min': 'Description should have at least {#limit} characters',
      'string.max': 'Description should have at most {#limit} characters',
      'any.required': 'Description is required'
    }),
  category: Joi.string().required().valid(
    'road_damage', 
    'water_issue', 
    'electricity_issue', 
    'waste_management', 
    'public_property_damage', 
    'street_lighting', 
    'sewage_problem',
    'public_transportation', 
    'environmental_issue', 
    'other'
  ).messages({
    'string.base': 'Category should be a string',
    'string.empty': 'Category is required',
    'any.only': 'Category must be one of the allowed values',
    'any.required': 'Category is required'
  }),
  location: Joi.object({
    address: Joi.string().required().min(5).max(200)
      .messages({
        'string.base': 'Address should be a string',
        'string.empty': 'Address is required',
        'string.min': 'Address should have at least {#limit} characters',
        'string.max': 'Address should have at most {#limit} characters',
        'any.required': 'Address is required'
      }),
    city: Joi.string().required().min(2).max(50)
      .messages({
        'string.base': 'City should be a string',
        'string.empty': 'City is required',
        'string.min': 'City should have at least {#limit} characters',
        'string.max': 'City should have at most {#limit} characters',
        'any.required': 'City is required'
      }),
    governorate: Joi.string().required().min(2).max(50)
      .messages({
        'string.base': 'Governorate should be a string',
        'string.empty': 'Governorate is required',
        'string.min': 'Governorate should have at least {#limit} characters',
        'string.max': 'Governorate should have at most {#limit} characters',
        'any.required': 'Governorate is required'
      }),
    coordinates: Joi.object({
      lat: Joi.number().required().min(-90).max(90)
        .messages({
          'number.base': 'Latitude should be a number',
          'number.min': 'Latitude should be at least {#limit}',
          'number.max': 'Latitude should be at most {#limit}',
          'any.required': 'Latitude is required'
        }),
      lng: Joi.number().required().min(-180).max(180)
        .messages({
          'number.base': 'Longitude should be a number',
          'number.min': 'Longitude should be at least {#limit}',
          'number.max': 'Longitude should be at most {#limit}',
          'any.required': 'Longitude is required'
        })
    }).required().messages({
      'object.base': 'Coordinates should be an object',
      'any.required': 'Coordinates are required'
    })
  }).required().messages({
    'object.base': 'Location should be an object',
    'any.required': 'Location is required'
  }),
  urgency: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
    .messages({
      'string.base': 'Urgency should be a string',
      'any.only': 'Urgency must be one of: low, medium, high, critical'
    })
});

// Update report validation schema
const updateReportSchema = Joi.object({
  title: Joi.string().min(5).max(100)
    .messages({
      'string.base': 'Title should be a string',
      'string.min': 'Title should have at least {#limit} characters',
      'string.max': 'Title should have at most {#limit} characters'
    }),
  description: Joi.string().min(10).max(2000)
    .messages({
      'string.base': 'Description should be a string',
      'string.min': 'Description should have at least {#limit} characters',
      'string.max': 'Description should have at most {#limit} characters'
    }),
  category: Joi.string().valid(
    'road_damage', 
    'water_issue', 
    'electricity_issue', 
    'waste_management', 
    'public_property_damage', 
    'street_lighting', 
    'sewage_problem',
    'public_transportation', 
    'environmental_issue', 
    'other'
  ).messages({
    'string.base': 'Category should be a string',
    'any.only': 'Category must be one of the allowed values'
  }),
  location: Joi.object({
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
      }),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90)
        .messages({
          'number.base': 'Latitude should be a number',
          'number.min': 'Latitude should be at least {#limit}',
          'number.max': 'Latitude should be at most {#limit}'
        }),
      lng: Joi.number().min(-180).max(180)
        .messages({
          'number.base': 'Longitude should be a number',
          'number.min': 'Longitude should be at least {#limit}',
          'number.max': 'Longitude should be at most {#limit}'
        })
    }).messages({
      'object.base': 'Coordinates should be an object'
    })
  }).messages({
    'object.base': 'Location should be an object'
  }),
  urgency: Joi.string().valid('low', 'medium', 'high', 'critical')
    .messages({
      'string.base': 'Urgency should be a string',
      'any.only': 'Urgency must be one of: low, medium, high, critical'
    })
});

// Update report status validation schema
const updateReportStatusSchema = Joi.object({
  status: Joi.string().required().valid('pending', 'in-progress', 'resolved', 'rejected')
    .messages({
      'string.base': 'Status should be a string',
      'string.empty': 'Status is required',
      'any.only': 'Status must be one of: pending, in-progress, resolved, rejected',
      'any.required': 'Status is required'
    }),
  note: Joi.string().max(500)
    .messages({
      'string.base': 'Note should be a string',
      'string.max': 'Note should have at most {#limit} characters'
    })
});

// Reports query validation schema
const reportsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page should be a number',
      'number.integer': 'Page should be an integer',
      'number.min': 'Page should be at least {#limit}'
    }),
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.base': 'Limit should be a number',
      'number.integer': 'Limit should be an integer',
      'number.min': 'Limit should be at least {#limit}',
      'number.max': 'Limit should be at most {#limit}'
    }),
  status: Joi.string().valid('pending', 'in-progress', 'resolved', 'rejected')
    .messages({
      'string.base': 'Status should be a string',
      'any.only': 'Status must be one of: pending, in-progress, resolved, rejected'
    }),
  category: Joi.string().valid(
    'road_damage', 
    'water_issue', 
    'electricity_issue', 
    'waste_management', 
    'public_property_damage', 
    'street_lighting', 
    'sewage_problem',
    'public_transportation', 
    'environmental_issue', 
    'other'
  ).messages({
    'string.base': 'Category should be a string',
    'any.only': 'Category must be one of the allowed values'
  }),
  urgency: Joi.string().valid('low', 'medium', 'high', 'critical')
    .messages({
      'string.base': 'Urgency should be a string',
      'any.only': 'Urgency must be one of: low, medium, high, critical'
    }),
  governorate: Joi.string()
    .messages({
      'string.base': 'Governorate should be a string'
    }),
  city: Joi.string()
    .messages({
      'string.base': 'City should be a string'
    }),
  startDate: Joi.date().iso()
    .messages({
      'date.base': 'Start date should be a valid date',
      'date.format': 'Start date should be in ISO format'
    }),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
    .messages({
      'date.base': 'End date should be a valid date',
      'date.format': 'End date should be in ISO format',
      'date.min': 'End date should be after start date'
    }),
  search: Joi.string().min(3)
    .messages({
      'string.base': 'Search query should be a string',
      'string.min': 'Search query should have at least {#limit} characters'
    }),
  sort: Joi.string().valid('createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'urgency', '-urgency')
    .messages({
      'string.base': 'Sort should be a string',
      'any.only': 'Sort must be one of the allowed values'
    })
}).unknown(true);

// Nearby reports query validation schema
const nearbyReportsQuerySchema = Joi.object({
  lat: Joi.number().required().min(-90).max(90)
    .messages({
      'number.base': 'Latitude should be a number',
      'number.min': 'Latitude should be at least {#limit}',
      'number.max': 'Latitude should be at most {#limit}',
      'any.required': 'Latitude is required'
    }),
  lng: Joi.number().required().min(-180).max(180)
    .messages({
      'number.base': 'Longitude should be a number',
      'number.min': 'Longitude should be at least {#limit}',
      'number.max': 'Longitude should be at most {#limit}',
      'any.required': 'Longitude is required'
    }),
  radius: Joi.number().min(0.1).max(100).default(5)
    .messages({
      'number.base': 'Radius should be a number',
      'number.min': 'Radius should be at least {#limit} kilometers',
      'number.max': 'Radius should be at most {#limit} kilometers'
    }),
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page should be a number',
      'number.integer': 'Page should be an integer',
      'number.min': 'Page should be at least {#limit}'
    }),
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.base': 'Limit should be a number',
      'number.integer': 'Limit should be an integer',
      'number.min': 'Limit should be at least {#limit}',
      'number.max': 'Limit should be at most {#limit}'
    })
}).unknown(true);

// Validate query parameters middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }

    next();
  };
};

// Export validation middlewares
export const validateCreateReport = validate(createReportSchema);
export const validateUpdateReport = validate(updateReportSchema);
export const validateUpdateReportStatus = validate(updateReportStatusSchema);
export const validateReportsQuery = validateQuery(reportsQuerySchema);
export const validateNearbyReportsQuery = validateQuery(nearbyReportsQuerySchema); 