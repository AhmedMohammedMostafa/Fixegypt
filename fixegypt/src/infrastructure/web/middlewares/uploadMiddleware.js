import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as uuid from 'uuid';
import { ApiError } from './errorHandler.js';
import config from '../../../config.js';

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuid.v4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new ApiError(400, 'Only image files are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize // 5MB (from config)
  },
  fileFilter
});

/**
 * Middleware for handling single image upload
 * @param {string} fieldName - Form field name
 */
const uploadSingleImage = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, `File size exceeds the limit of ${config.upload.maxFileSize / 1024 / 1024}MB`));
        }
        return next(new ApiError(400, err.message));
      } else if (err) {
        // An unknown error occurred
        return next(err);
      }
      
      // File uploaded successfully
      next();
    });
  };
};

/**
 * Middleware for handling multiple image uploads
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 */
const uploadMultipleImages = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multiUpload = upload.array(fieldName, maxCount);
    
    multiUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, `File size exceeds the limit of ${config.upload.maxFileSize / 1024 / 1024}MB`));
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApiError(400, `Maximum of ${maxCount} files allowed`));
        }
        return next(new ApiError(400, err.message));
      } else if (err) {
        // An unknown error occurred
        return next(err);
      }
      
      // Files uploaded successfully
      next();
    });
  };
};

/**
 * Process uploaded files to format them for storage
 * @param {Object} req - Express request object
 * @returns {Array} Array of file paths
 */
const getUploadedFilePaths = (req) => {
  if (!req.file && !req.files) {
    return [];
  }

  // Single file upload
  if (req.file) {
    return [req.file.path];
  }

  // Multiple file upload
  if (req.files && Array.isArray(req.files)) {
    return req.files.map(file => file.path);
  }

  return [];
};

export { uploadSingleImage, uploadMultipleImages, getUploadedFilePaths }; 