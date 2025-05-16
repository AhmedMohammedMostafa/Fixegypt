import PointsRepository from '../../../domain/repositories/PointsRepository.js';
import UserModel from '../models/UserModel.js';
import PointsTransactionModel from '../models/PointsTransactionModel.js';
import PointsTransaction from '../../../domain/entities/PointsTransaction.js';
import mongoose from 'mongoose';

/**
 * MongoDB implementation of PointsRepository
 */
class MongoPointsRepository extends PointsRepository {
  /**
   * Add points to a user
   * @param {string} userId - User ID
   * @param {number} amount - Points amount
   * @param {string} source - Source of points
   * @param {string} referenceId - ID of reference object
   * @param {string} description - Transaction description
   * @returns {Promise<Object>} Transaction and updated user
   */
  async addPoints(userId, amount, source, referenceId, description) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      // Find user and update points
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { points: amount } },
        { new: true, session }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Determine reference model
      let referenceModel = null;
      if (referenceId) {
        if (source === 'report_submission' || source === 'report_resolved') {
          referenceModel = 'Report';
        } else if (source === 'product_redemption') {
          referenceModel = 'Product';
        }
      }
      
      // Create transaction
      const transaction = await PointsTransactionModel.create([{
        userId,
        amount,
        type: 'earn',
        source,
        referenceId: referenceId || null,
        referenceModel,
        description,
        balance: user.points
      }], { session });
      
      await session.commitTransaction();
      
      return {
        user,
        transaction: transaction[0]
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Deduct points from a user
   * @param {string} userId - User ID
   * @param {number} amount - Points amount
   * @param {string} referenceId - ID of reference object
   * @param {string} description - Transaction description
   * @returns {Promise<Object>} Transaction and updated user
   */
  async deductPoints(userId, amount, referenceId, description) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      // Check if user has enough points
      const user = await UserModel.findById(userId).session(session);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.points < amount) {
        throw new Error('Insufficient points');
      }
      
      // Update user points
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { points: -amount } },
        { new: true, session }
      );
      
      // Create transaction
      const transaction = await PointsTransactionModel.create([{
        userId,
        amount,
        type: 'redeem',
        source: 'product_redemption',
        referenceId: referenceId || null,
        referenceModel: referenceId ? 'Product' : null,
        description,
        balance: updatedUser.points
      }], { session });
      
      await session.commitTransaction();
      
      return {
        user: updatedUser,
        transaction: transaction[0]
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get user's points balance
   * @param {string} userId - User ID
   * @returns {Promise<number>} Points balance
   */
  async getBalance(userId) {
    const user = await UserModel.findById(userId).select('points');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.points;
  }

  /**
   * Get user's transaction history
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Transactions and pagination info
   */
  async getTransactionHistory(userId, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = { userId };
    
    if (options.type) {
      filter.type = options.type;
    }
    
    if (options.source) {
      filter.source = options.source;
    }
    
    // Execute query with pagination
    const transactions = await PointsTransactionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await PointsTransactionModel.countDocuments(filter);
    
    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default MongoPointsRepository; 