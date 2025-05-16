import { ApiError } from '../middlewares/errorHandler.js';
import MongoRedemptionRepository from '../../persistence/repositories/MongoRedemptionRepository.js';
import UpdateRedemptionStatusUseCase from '../../../application/use-cases/redemption/UpdateRedemptionStatusUseCase.js';

// Initialize repositories
const redemptionRepository = new MongoRedemptionRepository();

// Initialize use cases
const updateRedemptionStatusUseCase = new UpdateRedemptionStatusUseCase(redemptionRepository);

/**
 * Controller for redemption-related operations
 */
class RedemptionController {
  /**
   * Get user's redemptions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getUserRedemptions(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;
      
      // Build filter
      const filter = { userId };
      
      if (status) {
        filter.status = status;
      }
      
      // Get user's redemptions
      const result = await redemptionRepository.findAll(
        filter,
        {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10)
        }
      );
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Redemptions retrieved successfully',
        data: {
          redemptions: result.redemptions,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all redemptions (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getAllRedemptions(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        userId, 
        productId,
        startDate,
        endDate
      } = req.query;
      
      // Build filter
      const filter = {};
      
      if (status) filter.status = status;
      if (userId) filter.userId = userId;
      if (productId) filter.productId = productId;
      if (startDate) filter.startDate = startDate;
      if (endDate) filter.endDate = endDate;
      
      // Get redemptions
      const result = await redemptionRepository.findAll(
        filter,
        {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10)
        }
      );
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Redemptions retrieved successfully',
        data: {
          redemptions: result.redemptions,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get redemption by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getRedemptionById(req, res, next) {
    try {
      const { redemptionId } = req.params;
      
      // Get redemption
      const redemption = await redemptionRepository.findById(redemptionId);
      
      // Check if user is authorized to view this redemption
      if (req.user.role !== 'admin' && redemption.userId.toString() !== req.user.id) {
        throw new ApiError(403, 'You are not authorized to view this redemption');
      }
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Redemption retrieved successfully',
        data: {
          redemption
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update redemption status (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateRedemptionStatus(req, res, next) {
    try {
      const { redemptionId } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;
      
      // Update redemption
      const redemption = await updateRedemptionStatusUseCase.execute(
        redemptionId,
        status,
        adminId,
        notes
      );
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Redemption status updated successfully',
        data: {
          redemption
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get redemption statistics (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getRedemptionStatistics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      // Build filter
      const filter = {};
      
      if (startDate) filter.startDate = startDate;
      if (endDate) filter.endDate = endDate;
      
      // Get statistics
      const statistics = await redemptionRepository.getStatistics(filter);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Redemption statistics retrieved successfully',
        data: {
          statistics
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RedemptionController(); 