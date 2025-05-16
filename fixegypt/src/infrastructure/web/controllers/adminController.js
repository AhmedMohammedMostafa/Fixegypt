import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../../persistence/models/UserModel.js';
import ReportModel from '../../persistence/models/ReportModel.js';
import config from '../../../config.js';
import adminConfig from '../../config/adminConfig.js';
import { ApiError } from '../middlewares/errorHandler.js';
import logger from '../middlewares/logger.js';
import analyticsService from '../../analytics/AnalyticsService.js';
import emailService from '../../email/EmailService.js';
import MongoUserRepository from '../../persistence/repositories/MongoUserRepository.js';

// Create instance of user repository
const userRepository = new MongoUserRepository();

/**
 * Admin controller for managing admin-specific operations
 */
class AdminController {
  /**
   * Admin login with fixed credentials or database admin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Check if an admin exists in the database
      let admin = await UserModel.findOne({ 
        email: email.toLowerCase(),
        role: 'admin'
      });

      // If no admin in database, use default admin credentials
      if (!admin) {
        // Check against default admin
        if (email.toLowerCase() === adminConfig.defaultAdmin.email.toLowerCase() && 
            password === adminConfig.defaultAdmin.password) {
          
          // Create default admin in database if doesn't exist
          const hashedPassword = await bcrypt.hash(adminConfig.defaultAdmin.password, 10);
          admin = await UserModel.create({
            ...adminConfig.defaultAdmin,
            password: hashedPassword,
            email: adminConfig.defaultAdmin.email.toLowerCase()
          });
          
          logger.info(`Default admin account created: ${admin._id}`);
        } else {
          throw new ApiError(401, 'Invalid credentials');
        }
      } else {
        // Verify password for existing admin
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
          throw new ApiError(401, 'Invalid credentials');
        }
      }

      // Generate admin tokens with extended expiration
      const accessToken = jwt.sign(
        { id: admin._id, role: admin.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { id: admin._id, role: admin.role },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      // Update last login time
      admin.lastLogin = new Date();
      await admin.save();

      res.status(200).json({
        status: 'success',
        message: 'Admin logged in successfully',
        data: {
          user: {
            id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: admin.role
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      // Build query filters
      const filters = {};
      
      if (req.query.role) {
        filters.role = req.query.role;
      }
      
      if (req.query.isVerified) {
        filters.isVerified = req.query.isVerified === 'true';
      }
      
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filters.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { nationalId: searchRegex }
        ];
      }

      // Execute query with pagination
      const users = await UserModel.find(filters)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await UserModel.countDocuments(filters);

      res.status(200).json({
        status: 'success',
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async verifyUser(req, res, next) {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid user ID');
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Update verification status
      user.isVerified = true;
      user.verificationToken = null;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'User verified successfully',
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['citizen', 'admin', 'manager', 'analyst'];
      if (!validRoles.includes(role)) {
        throw new ApiError(400, 'Invalid role. Valid roles are: ' + validRoles.join(', '));
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid user ID');
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Update role
      user.role = role;
      await user.save();

      logger.info(`User role updated: ${userId} to ${role} by admin ${req.user.id}`);

      res.status(200).json({
        status: 'success',
        message: 'User role updated successfully',
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getDashboardStats(req, res, next) {
    try {
      logger.debug('Starting to fetch dashboard stats');
      
      // Get counts of users and reports
      const totalUsers = await UserModel.countDocuments();
      logger.debug(`Total users: ${totalUsers}`);
      
      const totalReports = await ReportModel.countDocuments();
      logger.debug(`Total reports: ${totalReports}`);
      
      const pendingReports = await ReportModel.countDocuments({ status: 'pending' });
      logger.debug(`Pending reports: ${pendingReports}`);
      
      const resolvedReports = await ReportModel.countDocuments({ status: 'resolved' });
      logger.debug(`Resolved reports: ${resolvedReports}`);
      
      const inProgressReports = await ReportModel.countDocuments({ status: 'in-progress' });
      logger.debug(`In-progress reports: ${inProgressReports}`);
      
      const rejectedReports = await ReportModel.countDocuments({ status: 'rejected' });
      logger.debug(`Rejected reports: ${rejectedReports}`);
      
      const criticalReports = await ReportModel.countDocuments({ urgency: 'critical' });
      logger.debug(`Critical reports: ${criticalReports}`);

      // Get recent registrations
      logger.debug('Fetching recent users');
      const recentUsers = await UserModel.find()
        .select('firstName lastName email createdAt isVerified')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(); // Use lean() to convert to simple JS objects

      // Get recent reports
      logger.debug('Fetching recent reports');
      const recentReports = await ReportModel.find()
        .select('title category status urgency createdAt location')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(); // Use lean() to convert to simple JS objects

      // Get status distribution
      logger.debug('Calculating status distribution');
      const statusDistribution = await ReportModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);

      // Get category distribution
      logger.debug('Calculating category distribution');
      const categoryDistribution = await ReportModel.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get urgency distribution
      logger.debug('Calculating urgency distribution');
      const urgencyDistribution = await ReportModel.aggregate([
        {
          $group: {
            _id: '$urgency',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            urgency: '$_id',
            count: 1,
            _id: 0
          }
        },
        { 
          $sort: { 
            urgency: 1 
          } 
        }
      ]);

      // Prepare response data
      const responseData = {
        counts: {
          users: totalUsers,
          reports: totalReports,
          pendingReports,
          resolvedReports,
          inProgressReports,
          rejectedReports,
          criticalReports
        },
        recentUsers,
        recentReports,
        distributions: {
          status: statusDistribution,
          category: categoryDistribution,
          urgency: urgencyDistribution
        }
      };
      
      logger.debug('Dashboard stats prepared successfully', { data: JSON.stringify(responseData) });

      res.status(200).json({
        status: 'success',
        message: 'Dashboard statistics retrieved successfully',
        data: responseData
      });
    } catch (error) {
      logger.error('Error in getDashboardStats:', error);
      next(error);
    }
  }

  /**
   * Get pending reports for admin review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getPendingReports(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      // Get pending reports
      const pendingReports = await ReportModel.find({ status: 'pending' })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await ReportModel.countDocuments({ status: 'pending' });

      res.status(200).json({
        status: 'success',
        message: 'Pending reports retrieved successfully',
        data: {
          reports: pendingReports,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update report status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateReportStatus(req, res, next) {
    try {
      const { reportId } = req.params;
      const { status, note } = req.body;

      // Validate status
      const validStatuses = ['pending', 'in-progress', 'resolved', 'rejected'];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid status. Valid statuses are: ' + validStatuses.join(', '));
      }

      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        throw new ApiError(400, 'Invalid report ID');
      }

      const report = await ReportModel.findById(reportId);
      if (!report) {
        throw new ApiError(404, 'Report not found');
      }

      // Add status history entry
      const statusEntry = {
        status,
        timestamp: new Date(),
        adminId: req.user.id,
        note: note || ''
      };

      report.status = status;
      report.adminId = req.user.id;
      report.statusHistory.push(statusEntry);

      await report.save();

      logger.info(`Report status updated: ${reportId} to ${status} by admin ${req.user.id}`);

      // Get report owner and send email notification
      try {
        const reportOwner = await userRepository.findById(report.userId);
        
        if (reportOwner) {
          // Send notification email
          try {
            await emailService.sendReportStatusUpdateEmail(reportOwner, report, status, note);
            logger.info(`Status update email sent to user: ${reportOwner.id} for report: ${reportId}`);
          } catch (emailError) {
            logger.error(`Error sending status update email to user ${reportOwner.id}:`, emailError);
            // Continue processing even if email fails
          }
        } else {
          logger.warn(`Report owner not found for report ${reportId}, cannot send email notification`);
        }
      } catch (userError) {
        logger.error(`Error finding report owner for report ${reportId}:`, userError);
      }

      res.status(200).json({
        status: 'success',
        message: 'Report status updated successfully',
        data: {
          report
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get analytics data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getAnalytics(req, res, next) {
    try {
      const { type, timeUnit = 'week' } = req.query;
      
      // Build filters from query params
      const filters = {};
      
      if (req.query.startDate) {
        filters.startDate = req.query.startDate;
      }
      
      if (req.query.endDate) {
        filters.endDate = req.query.endDate;
      }
      
      if (req.query.category) {
        filters.category = req.query.category;
      }
      
      if (req.query.governorate) {
        filters.governorate = req.query.governorate;
      }
      
      let data;
      
      // Get appropriate analytics based on requested type
      switch (type) {
        case 'resolution-time-category':
          data = await analyticsService.getResolutionTimeByCategory(filters);
          break;
        case 'resolution-time-area':
          data = await analyticsService.getResolutionTimeByArea(filters);
          break;
        case 'trends':
          data = await analyticsService.getTrendAnalysis(filters, timeUnit);
          break;
        case 'seasonal':
          data = await analyticsService.getSeasonalPatterns(filters);
          break;
        case 'agency-performance':
          data = await analyticsService.getAgencyPerformanceMetrics(filters);
          break;
        case 'damage-assessment':
          data = await analyticsService.getDamageAssessmentMetrics(filters);
          break;
        default:
          throw new ApiError(400, `Invalid analytics type: ${type}`);
      }

      res.status(200).json({
        status: 'success',
        message: 'Analytics data retrieved successfully',
        data: {
          type,
          filters,
          results: data
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController(); 