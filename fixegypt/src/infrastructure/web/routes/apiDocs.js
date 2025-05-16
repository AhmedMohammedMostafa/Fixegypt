import swaggerJsDoc from 'swagger-jsdoc';
import config from '../../../config.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FixEgypt API',
      version: '1.0.0',
      description: 'FixEgypt - Egyptian City Report Platform API',
      contact: {
        name: 'API Support',
        email: 'support@fixegypt.org',
        url: 'https://fixegypt.org/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}/api`,
        description: 'Development server'
      },
      {
        url: 'https://api.fixegypt.org/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['nationalId', 'firstName', 'lastName', 'email', 'password', 'phone', 'address', 'city', 'governorate'],
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            nationalId: {
              type: 'string',
              description: 'Egyptian National ID (14 digits)'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            phone: {
              type: 'string',
              description: 'Egyptian phone number'
            },
            address: {
              type: 'string',
              description: 'User address'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            governorate: {
              type: 'string',
              description: 'Governorate'
            },
            role: {
              type: 'string',
              enum: ['citizen', 'admin'],
              description: 'User role'
            },
            isVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update date'
            }
          }
        },
        Report: {
          type: 'object',
          required: ['title', 'description', 'category', 'location', 'userId'],
          properties: {
            id: {
              type: 'string',
              description: 'Report ID'
            },
            title: {
              type: 'string',
              description: 'Report title'
            },
            description: {
              type: 'string',
              description: 'Report description'
            },
            category: {
              type: 'string',
              enum: [
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
              ],
              description: 'Report category'
            },
            location: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  description: 'Address'
                },
                city: {
                  type: 'string',
                  description: 'City'
                },
                governorate: {
                  type: 'string',
                  description: 'Governorate'
                },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: {
                      type: 'number',
                      description: 'Latitude'
                    },
                    lng: {
                      type: 'number',
                      description: 'Longitude'
                    }
                  }
                }
              }
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'Image URL'
                  },
                  uploadedAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Image upload date'
                  }
                }
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'resolved', 'rejected'],
              description: 'Report status'
            },
            urgency: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Report urgency'
            },
            userId: {
              type: 'string',
              description: 'ID of user who created the report'
            },
            adminId: {
              type: 'string',
              description: 'ID of admin who processed the report'
            },
            aiAnalysis: {
              type: 'object',
              properties: {
                classification: {
                  type: 'string',
                  description: 'AI classification'
                },
                urgency: {
                  type: 'string',
                  description: 'AI detected urgency'
                },
                confidence: {
                  type: 'number',
                  description: 'AI confidence level'
                },
                analysisTimestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'AI analysis date'
                }
              }
            },
            statusHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    description: 'Status value'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Status change date'
                  },
                  adminId: {
                    type: 'string',
                    description: 'ID of admin who changed status'
                  },
                  note: {
                    type: 'string',
                    description: 'Note about status change'
                  }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Report creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Report last update date'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error'],
              description: 'Response status'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error'],
              description: 'Error status'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (development only)'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['nationalId', 'firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone', 'address', 'city', 'governorate'],
          properties: {
            nationalId: {
              type: 'string',
              description: 'Egyptian National ID (14 digits)',
              pattern: '^\\d{14}$'
            },
            firstName: {
              type: 'string',
              description: 'First name',
              minLength: 2,
              maxLength: 50
            },
            lastName: {
              type: 'string',
              description: 'Last name',
              minLength: 2,
              maxLength: 50
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password',
              minLength: 6,
              maxLength: 30
            },
            confirmPassword: {
              type: 'string',
              format: 'password',
              description: 'Confirm password'
            },
            phone: {
              type: 'string',
              description: 'Egyptian phone number',
              pattern: '^01[0-2|5]{1}[0-9]{8}$'
            },
            address: {
              type: 'string',
              description: 'Home address',
              minLength: 5,
              maxLength: 200
            },
            city: {
              type: 'string',
              description: 'City',
              minLength: 2,
              maxLength: 50
            },
            governorate: {
              type: 'string',
              description: 'Governorate',
              minLength: 2,
              maxLength: 50
            }
          }
        },
        CreateReportRequest: {
          type: 'object',
          required: ['title', 'description', 'category', 'location'],
          properties: {
            title: {
              type: 'string',
              description: 'Report title',
              minLength: 5,
              maxLength: 100
            },
            description: {
              type: 'string',
              description: 'Report description',
              minLength: 10,
              maxLength: 2000
            },
            category: {
              type: 'string',
              enum: [
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
              ],
              description: 'Report category'
            },
            location: {
              type: 'object',
              required: ['address', 'city', 'governorate', 'coordinates'],
              properties: {
                address: {
                  type: 'string',
                  description: 'Address',
                  minLength: 5,
                  maxLength: 200
                },
                city: {
                  type: 'string',
                  description: 'City',
                  minLength: 2,
                  maxLength: 50
                },
                governorate: {
                  type: 'string',
                  description: 'Governorate',
                  minLength: 2,
                  maxLength: 50
                },
                coordinates: {
                  type: 'object',
                  required: ['lat', 'lng'],
                  properties: {
                    lat: {
                      type: 'number',
                      description: 'Latitude',
                      minimum: -90,
                      maximum: 90
                    },
                    lng: {
                      type: 'number',
                      description: 'Longitude',
                      minimum: -180,
                      maximum: 180
                    }
                  }
                }
              }
            },
            urgency: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Report urgency'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/infrastructure/web/routes/*.js'], // Path to the API route files
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs; 