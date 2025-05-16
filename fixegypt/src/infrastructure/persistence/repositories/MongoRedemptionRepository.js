import RedemptionRepository from '../../../domain/repositories/RedemptionRepository.js';
import RedemptionModel from '../models/RedemptionModel.js';
import Redemption from '../../../domain/entities/Redemption.js';

/**
 * MongoDB implementation of RedemptionRepository
 */
class MongoRedemptionRepository extends RedemptionRepository {
  /**
   * Create a new redemption request
   * @param {Object} redemptionData - Redemption data
   * @returns {Promise<Object>} Created redemption
   */
  async create(redemptionData) {
    const redemption = await RedemptionModel.create(redemptionData);
    return redemption;
  }

  /**
   * Update redemption status
   * @param {string} redemptionId - Redemption ID
   * @param {string} status - New status
   * @param {string} adminId - Admin ID
   * @param {string} notes - Notes about the status change
   * @returns {Promise<Object>} Updated redemption
   */
  async updateStatus(redemptionId, status, adminId, notes) {
    // Validate status
    if (!['pending', 'processing', 'completed', 'rejected'].includes(status)) {
      throw new Error('Invalid status value');
    }
    
    // Prepare update data
    const updateData = {
      status,
      adminId,
      notes: notes || '',
      updatedAt: new Date()
    };
    
    // Add status-specific dates
    if (status === 'processing') {
      updateData.processingDate = new Date();
    } else if (status === 'completed') {
      updateData.completionDate = new Date();
    }
    
    // Update redemption
    const redemption = await RedemptionModel.findByIdAndUpdate(
      redemptionId,
      updateData,
      { new: true }
    ).populate('productId', 'name pointsCost');
    
    if (!redemption) {
      throw new Error('Redemption not found');
    }
    
    return redemption;
  }

  /**
   * Find redemption by ID
   * @param {string} redemptionId - Redemption ID
   * @returns {Promise<Object>} Redemption
   */
  async findById(redemptionId) {
    const redemption = await RedemptionModel.findById(redemptionId)
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name description pointsCost category image')
      .populate('adminId', 'firstName lastName');
    
    if (!redemption) {
      throw new Error('Redemption not found');
    }
    
    return redemption;
  }

  /**
   * Find all redemptions with filtering and pagination
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} Redemptions and pagination info
   */
  async findAll(filter = {}, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const sort = options.sort || { createdAt: -1 };
    
    // Build query filter
    const queryFilter = {};
    
    if (filter.status) {
      queryFilter.status = filter.status;
    }
    
    if (filter.userId) {
      queryFilter.userId = filter.userId;
    }
    
    if (filter.productId) {
      queryFilter.productId = filter.productId;
    }
    
    if (filter.startDate && filter.endDate) {
      queryFilter.createdAt = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate)
      };
    } else if (filter.startDate) {
      queryFilter.createdAt = { $gte: new Date(filter.startDate) };
    } else if (filter.endDate) {
      queryFilter.createdAt = { $lte: new Date(filter.endDate) };
    }
    
    // Execute query with pagination
    const redemptions = await RedemptionModel.find(queryFilter)
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name pointsCost category')
      .populate('adminId', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await RedemptionModel.countDocuments(queryFilter);
    
    return {
      redemptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find user's redemptions
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Redemptions and pagination info
   */
  async findByUserId(userId, options = {}) {
    return this.findAll({ userId }, options);
  }

  /**
   * Get redemption statistics
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Redemption statistics
   */
  async getStatistics(filter = {}) {
    // Build match stage for aggregation
    const match = {};
    
    if (filter.startDate && filter.endDate) {
      match.createdAt = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate)
      };
    } else if (filter.startDate) {
      match.createdAt = { $gte: new Date(filter.startDate) };
    } else if (filter.endDate) {
      match.createdAt = { $lte: new Date(filter.endDate) };
    }
    
    // Get counts by status
    const statusCounts = await RedemptionModel.aggregate([
      { $match: match },
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
    
    // Get top redeemed products
    const topProducts = await RedemptionModel.aggregate([
      { $match: { ...match, status: 'completed' } },
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 },
          totalPoints: { $sum: '$pointsCost' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          category: '$product.category',
          count: 1,
          totalPoints: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get total points redeemed
    const pointsStats = await RedemptionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRedemptions: { $sum: 1 },
          totalPointsRedeemed: { $sum: '$pointsCost' },
          avgPointsPerRedemption: { $avg: '$pointsCost' }
        }
      },
      {
        $project: {
          _id: 0,
          totalRedemptions: 1,
          totalPointsRedeemed: 1,
          avgPointsPerRedemption: { $round: ['$avgPointsPerRedemption', 2] }
        }
      }
    ]);
    
    return {
      statusCounts: statusCounts || [],
      pointsStats: pointsStats[0] || {
        totalRedemptions: 0,
        totalPointsRedeemed: 0,
        avgPointsPerRedemption: 0
      },
      topProducts: topProducts || []
    };
  }
}

export default MongoRedemptionRepository; 