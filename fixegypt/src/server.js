import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import rateLimit from 'express-rate-limit'; // Rate limiting removed
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';
import connectDB from './infrastructure/persistence/database.js';
import logger from './infrastructure/web/middlewares/logger.js';
import errorHandler, { notFound } from './infrastructure/web/middlewares/errorHandler.js';
import swaggerDocs from './infrastructure/web/routes/apiDocs.js';

// Routes will be imported here
import authRoutes from './infrastructure/web/routes/authRoutes.js';
import reportRoutes from './infrastructure/web/routes/reportRoutes.js';
import userRoutes from './infrastructure/web/routes/userRoutes.js';
import adminRoutes from './infrastructure/web/routes/adminRoutes.js';
import pointsRoutes from './infrastructure/web/routes/pointsRoutes.js';
import productRoutes from './infrastructure/web/routes/productRoutes.js';
import redemptionRoutes from './infrastructure/web/routes/redemptionRoutes.js';

// Add imports for compression and caching middleware
import compressionMiddleware from './infrastructure/web/middlewares/compressionMiddleware.js';

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Apply compression middleware (must be at the top)
app.use(compressionMiddleware);

// Security middleware
app.use(helmet()); // Security headers

// CORS configuration
app.use(cors({
  origin: config.security.cors.origin,
  methods: config.security.cors.methods,
  allowedHeaders: config.security.cors.allowedHeaders
}));

// Content parsing middleware
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging middleware
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logging

// Rate limiting - REMOVED
// const limiter = rateLimit({
//   windowMs: config.rateLimit.windowMs,
//   max: config.rateLimit.max,
//   message: 'Too many requests from this IP, please try again later'
// });
// app.use('/api', limiter);

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FixEgypt API Documentation',
  customfavIcon: '/uploads/favicon.ico',
  explorer: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/redemptions', redemptionRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.server.nodeEnv
  });
});

// 404 handler
app.use(notFound);

// Error handler middleware (should be last)
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.server.nodeEnv} mode on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default server; 