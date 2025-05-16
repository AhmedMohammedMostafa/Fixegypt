import MongoUserRepository from '../../persistence/repositories/MongoUserRepository.js';
import MongoReportRepository from '../../persistence/repositories/MongoReportRepository.js';
import authService from '../../../domain/services/AuthService.js';
import { ApiError } from '../middlewares/errorHandler.js';

// Create instances of required dependencies
const userRepository = new MongoUserRepository();
const reportRepository = new MongoReportRepository();

/**
 * UserController provides handlers for user-related routes
 */
class UserController {
  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Get user profile
      const user = await userRepository.findById(userId);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'User profile retrieved successfully',
        data: {
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reports submitted by the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getUserReports(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Fetch reports submitted by the user
      const reports = await reportRepository.findByUserId(userId);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'User reports retrieved successfully',
        data: {
          reports
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // Prevent updating restricted fields
      const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'governorate'];
      const filteredUpdateData = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdateData[key] = updateData[key];
        }
      });
      
      if (Object.keys(filteredUpdateData).length === 0) {
        throw new ApiError(400, 'No valid fields to update');
      }
      
      // Update user profile
      const updatedUser = await userRepository.update(userId, filteredUpdateData);
      
      if (!updatedUser) {
        throw new ApiError(404, 'User not found');
      }
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'User profile updated successfully',
        data: {
          user: updatedUser.toSafeObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      // Get user
      const user = await userRepository.findById(userId);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      // Verify current password
      const isPasswordValid = await authService.comparePassword(currentPassword, user.password);
      
      if (!isPasswordValid) {
        throw new ApiError(401, 'Current password is incorrect');
      }
      
      // Hash new password
      const hashedPassword = await authService.hashPassword(newPassword);
      
      // Update user password
      await userRepository.update(userId, { password: hashedPassword });
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { password } = req.body;
      
      // Get user
      const user = await userRepository.findById(userId);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      // Prevent admin from deleting their account through this endpoint
      if (user.role === 'admin') {
        throw new ApiError(403, 'Admin accounts cannot be deleted through this endpoint');
      }
      
      // Verify password
      const isPasswordValid = await authService.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        throw new ApiError(401, 'Password is incorrect');
      }
      
      // Delete user
      await userRepository.delete(userId);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController(); 