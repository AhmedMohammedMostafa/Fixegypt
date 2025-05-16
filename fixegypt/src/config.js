import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/city-report-platform',
    testUri: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/city-report-platform-test'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_key_for_development',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_for_development',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'no-reply@city-report.eg'
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000, // 15 minutes in milliseconds
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 100 requests per windowMs
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini', // 'gemini', 'openrouter', or 'huggingface'
    apiKey: process.env.AI_API_KEY || 'DEMO_API_KEY', // Default key for testing
    
    // Gemini API configuration
    geminiVisionModel: process.env.GEMINI_VISION_MODEL || 'gemini-1.5-flash',
    geminiTextModel: process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash',
    
    // OpenRouter configuration
    openRouterModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-opus:beta',
    httpReferrer: process.env.OPENROUTER_REFERRER || 'https://fixegypt.org',
    
    // Hugging Face configuration
    huggingfaceEndpoint: process.env.HUGGINGFACE_ENDPOINT || 'https://api-inference.huggingface.co/models/facebook/detr-resnet-50-panoptic',
    huggingfaceTextEndpoint: process.env.HUGGINGFACE_TEXT_ENDPOINT || 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
    
    // Caching configuration
    cacheResults: process.env.AI_CACHE_RESULTS === 'true',
    cacheTTL: parseInt(process.env.AI_CACHE_TTL || '3600', 10), // 1 hour in seconds
    
    // Request timeout in milliseconds
    timeout: parseInt(process.env.AI_TIMEOUT || '30000', 10), // 30 seconds
    
    // For backward compatibility
    imageAnalysisEndpoint: process.env.AI_IMAGE_ANALYSIS_ENDPOINT,
    urgencyDetectionEndpoint: process.env.AI_URGENCY_DETECTION_ENDPOINT,
    
    // Error handling options
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
    fallbackToLocal: process.env.AI_FALLBACK_TO_LOCAL === 'true' || true,
    
    // Enable debug mode for AI services
    debug: process.env.AI_DEBUG === 'true' || true
  },
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hour in seconds
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10)
  },
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: process.env.CORS_ALLOWED_HEADERS
    },
    contentSecurityPolicy: process.env.ENABLE_CSP === 'true',
    xssProtection: process.env.ENABLE_XSS_PROTECTION === 'true'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_TO_FILE === 'true',
    maxSize: parseInt(process.env.LOG_MAX_SIZE || '5242880', 10), // 5MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10)
  }
};

export default config; 