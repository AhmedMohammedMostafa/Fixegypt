import { ApiError } from '../middlewares/errorHandler.js';
import MongoPointsRepository from '../../persistence/repositories/MongoPointsRepository.js';
import MongoUserRepository from '../../persistence/repositories/MongoUserRepository.js';
import MongoReportRepository from '../../persistence/repositories/MongoReportRepository.js';
import AwardPointsForReportUseCase from '../../../application/use-cases/points/AwardPointsForReportUseCase.js';
import AwardPointsForReportSubmissionUseCase from '../../../application/use-cases/points/AwardPointsForReportSubmissionUseCase.js';

// Initialize repositories
const pointsRepository = new MongoPointsRepository();
const userRepository = new MongoUserRepository();
const reportRepository = new MongoReportRepository();

// Initialize use cases
const awardPointsForReportUseCase = new AwardPointsForReportUseCase(
  pointsRepository,
  userRepository,
  reportRepository
);

const awardPointsForReportSubmissionUseCase = new AwardPointsForReportSubmissionUseCase(
  pointsRepository,
  userRepository,
  reportRepository
);

/**
 * Controller for points-related operations
 */
class PointsController {
  /**
   * Get user's points balance
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getBalance(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Get user's points balance
      const points = await pointsRepository.getBalance(userId);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Points balance retrieved successfully',
        data: {
          points
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's transaction history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getTransactionHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, type, source } = req.query;
      
      // Get transaction history
      const result = await pointsRepository.getTransactionHistory(
        userId,
        {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          type,
          source
        }
      );
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Transaction history retrieved successfully',
        data: {
          transactions: result.transactions,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Award points for report submission
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async awardPointsForSubmission(req, res, next) {
    try {
      const { reportId } = req.params;
      
      // Award points
      const result = await awardPointsForReportSubmissionUseCase.execute(reportId);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Points awarded for report submission',
        data: {
          pointsAwarded: result.pointsAwarded,
          newBalance: result.user.points
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Award points for resolved report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async awardPointsForResolution(req, res, next) {
    try {
      const { reportId } = req.params;
      const adminId = req.user.id;
      
      // Award points
      const result = await awardPointsForReportUseCase.execute(reportId, adminId);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Points awarded for report resolution',
        data: {
          pointsAwarded: result.pointsAwarded,
          newBalance: result.user.points
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PointsController(); 