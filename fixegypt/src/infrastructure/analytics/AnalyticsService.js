import mongoose from 'mongoose';
import ReportModel from '../persistence/models/ReportModel.js';
import config from '../../config.js';
import logger from '../web/middlewares/logger.js';

/**
 * Service for analyzing report data and generating insights
 */
class AnalyticsService {
  /**
   * Calculate resolution time statistics by category
   * @param {Object} filters - Optional filters for data selection
   * @returns {Promise<Array>} Resolution time stats by category
   */
  async getResolutionTimeByCategory(filters = {}) {
    try {
      const match = this._buildBaseMatchQuery(filters);
      
      // Only include resolved reports
      match.status = 'resolved';
      
      const pipeline = [
        { $match: match },
        {
          $addFields: {
            // Calculate resolution time in hours
            resolutionTimeHours: {
              $divide: [
                { $subtract: ["$statusHistory.timestamp", "$createdAt"] },
                3600000 // Convert ms to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: "$category",
            averageResolutionTime: { $avg: "$resolutionTimeHours" },
            minResolutionTime: { $min: "$resolutionTimeHours" },
            maxResolutionTime: { $max: "$resolutionTimeHours" },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            category: "$_id",
            averageResolutionTime: { $round: ["$averageResolutionTime", 2] },
            minResolutionTime: { $round: ["$minResolutionTime", 2] },
            maxResolutionTime: { $round: ["$maxResolutionTime", 2] },
            count: 1,
            _id: 0
          }
        },
        { $sort: { averageResolutionTime: 1 } }
      ];

      return await ReportModel.aggregate(pipeline);
    } catch (error) {
      logger.error(`Error calculating resolution time by category: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate resolution time statistics by area (governorate)
   * @param {Object} filters - Optional filters for data selection
   * @returns {Promise<Array>} Resolution time stats by area
   */
  async getResolutionTimeByArea(filters = {}) {
    try {
      const match = this._buildBaseMatchQuery(filters);
      
      // Only include resolved reports
      match.status = 'resolved';
      
      const pipeline = [
        { $match: match },
        {
          $addFields: {
            // Calculate resolution time in hours
            resolutionTimeHours: {
              $divide: [
                { $subtract: ["$statusHistory.timestamp", "$createdAt"] },
                3600000 // Convert ms to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: "$location.governorate",
            averageResolutionTime: { $avg: "$resolutionTimeHours" },
            minResolutionTime: { $min: "$resolutionTimeHours" },
            maxResolutionTime: { $max: "$resolutionTimeHours" },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            governorate: "$_id",
            averageResolutionTime: { $round: ["$averageResolutionTime", 2] },
            minResolutionTime: { $round: ["$minResolutionTime", 2] },
            maxResolutionTime: { $round: ["$maxResolutionTime", 2] },
            count: 1,
            _id: 0
          }
        },
        { $sort: { averageResolutionTime: 1 } }
      ];

      return await ReportModel.aggregate(pipeline);
    } catch (error) {
      logger.error(`Error calculating resolution time by area: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get trending issues by category over time
   * @param {Object} filters - Optional filters
   * @param {string} timeUnit - Time unit for grouping ('day', 'week', 'month')
   * @returns {Promise<Array>} Trend data
   */
  async getTrendAnalysis(filters = {}, timeUnit = 'week') {
    try {
      const match = this._buildBaseMatchQuery(filters);
      
      // Time grouping format based on requested unit
      let dateFormat;
      switch (timeUnit) {
        case 'day':
          dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case 'month':
          dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        case 'week':
        default:
          dateFormat = { 
            $dateToString: { 
              format: '%Y-W%U', 
              date: '$createdAt' 
            } 
          };
      }
      
      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: {
              timeFrame: dateFormat,
              category: '$category'
            },
            count: { $sum: 1 },
            avgUrgency: { 
              $avg: { 
                $switch: {
                  branches: [
                    { case: { $eq: ['$urgency', 'low'] }, then: 1 },
                    { case: { $eq: ['$urgency', 'medium'] }, then: 2 },
                    { case: { $eq: ['$urgency', 'high'] }, then: 3 },
                    { case: { $eq: ['$urgency', 'critical'] }, then: 4 }
                  ],
                  default: 0
                }
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.timeFrame',
            categories: {
              $push: {
                category: '$_id.category',
                count: '$count',
                avgUrgency: { $round: ['$avgUrgency', 2] }
              }
            },
            totalCount: { $sum: '$count' }
          }
        },
        {
          $project: {
            timeFrame: '$_id',
            categories: 1,
            totalCount: 1,
            _id: 0
          }
        },
        { $sort: { timeFrame: 1 } }
      ];

      return await ReportModel.aggregate(pipeline);
    } catch (error) {
      logger.error(`Error calculating trend analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get seasonal patterns in report submissions
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Seasonal pattern data
   */
  async getSeasonalPatterns(filters = {}) {
    try {
      const match = this._buildBaseMatchQuery(filters);
      
      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              category: '$category'
            },
            count: { $sum: 1 },
            avgUrgency: { 
              $avg: { 
                $switch: {
                  branches: [
                    { case: { $eq: ['$urgency', 'low'] }, then: 1 },
                    { case: { $eq: ['$urgency', 'medium'] }, then: 2 },
                    { case: { $eq: ['$urgency', 'high'] }, then: 3 },
                    { case: { $eq: ['$urgency', 'critical'] }, then: 4 }
                  ],
                  default: 0
                }
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.month',
            categories: {
              $push: {
                category: '$_id.category',
                count: '$count',
                avgUrgency: { $round: ['$avgUrgency', 2] }
              }
            },
            totalCount: { $sum: '$count' }
          }
        },
        {
          $project: {
            month: '$_id',
            monthName: {
              $arrayElemAt: [
                ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'],
                { $subtract: ['$_id', 1] }
              ]
            },
            categories: 1,
            totalCount: 1,
            _id: 0
          }
        },
        { $sort: { month: 1 } }
      ];

      return await ReportModel.aggregate(pipeline);
    } catch (error) {
      logger.error(`Error calculating seasonal patterns: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate agency performance metrics (admins handling reports)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Agency performance data
   */
  async getAgencyPerformanceMetrics(filters = {}) {
    try {
      const match = this._buildBaseMatchQuery(filters);
      
      // Only include reports with an admin assigned
      match.adminId = { $exists: true, $ne: null };
      
      const pipeline = [
        { $match: match },
        { $lookup: {
            from: 'users',
            localField: 'adminId',
            foreignField: '_id',
            as: 'admin'
          }
        },
        { $unwind: '$admin' },
        {
          $addFields: {
            // Calculate response time in hours (time from creation to first status change)
            responseTimeHours: {
              $divide: [
                { $subtract: [
                  { $arrayElemAt: ['$statusHistory.timestamp', 0] },
                  '$createdAt'
                ]},
                3600000 // Convert ms to hours
              ]
            },
            // Calculate resolution time in hours (for resolved reports)
            resolutionTimeHours: {
              $cond: {
                if: { $eq: ['$status', 'resolved'] },
                then: {
                  $divide: [
                    { $subtract: ['$updatedAt', '$createdAt'] },
                    3600000 // Convert ms to hours
                  ]
                },
                else: null
              }
            }
          }
        },
        {
          $group: {
            _id: '$adminId',
            adminName: { $first: { $concat: ['$admin.firstName', ' ', '$admin.lastName'] } },
            totalReports: { $sum: 1 },
            resolvedReports: { 
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } 
            },
            rejectedReports: { 
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } 
            },
            pendingReports: { 
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
            },
            inProgressReports: { 
              $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } 
            },
            avgResponseTime: { $avg: '$responseTimeHours' },
            avgResolutionTime: { $avg: '$resolutionTimeHours' }
          }
        },
        {
          $project: {
            adminId: '$_id',
            adminName: 1,
            totalReports: 1,
            resolvedReports: 1,
            rejectedReports: 1,
            pendingReports: 1,
            inProgressReports: 1,
            resolutionRate: { 
              $round: [{ $multiply: [{ $divide: ['$resolvedReports', '$totalReports'] }, 100] }, 2] 
            },
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            avgResolutionTime: { $round: ['$avgResolutionTime', 2] },
            _id: 0
          }
        },
        { $sort: { resolutionRate: -1 } }
      ];

      return await ReportModel.aggregate(pipeline);
    } catch (error) {
      logger.error(`Error calculating agency performance metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate damage severity scores and estimated costs
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Damage assessment data
   */
  async getDamageAssessmentMetrics(filters = {}) {
    try {
      const match = this._buildBaseMatchQuery(filters);
      
      const pipeline = [
        { $match: match },
        {
          $addFields: {
            // Calculate severity score (1-10) based on urgency and AI confidence
            severityScore: {
              $round: [
                {
                  $multiply: [
                    {
                      $switch: {
                        branches: [
                          { case: { $eq: ['$urgency', 'low'] }, then: 0.25 },
                          { case: { $eq: ['$urgency', 'medium'] }, then: 0.5 },
                          { case: { $eq: ['$urgency', 'high'] }, then: 0.75 },
                          { case: { $eq: ['$urgency', 'critical'] }, then: 1.0 }
                        ],
                        default: 0.5
                      }
                    },
                    { $ifNull: ['$aiAnalysis.confidence', 0.7] },
                    10 // Scale to 1-10
                  ]
                },
                1 // Round to 1 decimal place
              ]
            },
            // Calculate estimated repair costs based on category and severity
            estimatedRepairCost: {
              $round: [
                {
                  $multiply: [
                    {
                      $switch: {
                        branches: [
                          { case: { $eq: ['$category', 'road_damage'] }, then: 5000 },
                          { case: { $eq: ['$category', 'water_issue'] }, then: 3000 },
                          { case: { $eq: ['$category', 'electricity_issue'] }, then: 3500 },
                          { case: { $eq: ['$category', 'waste_management'] }, then: 2000 },
                          { case: { $eq: ['$category', 'public_property_damage'] }, then: 4500 },
                          { case: { $eq: ['$category', 'street_lighting'] }, then: 2500 },
                          { case: { $eq: ['$category', 'sewage_problem'] }, then: 4000 },
                          { case: { $eq: ['$category', 'public_transportation'] }, then: 6000 },
                          { case: { $eq: ['$category', 'environmental_issue'] }, then: 3500 }
                        ],
                        default: 3000 // Default base cost
                      }
                    },
                    {
                      $add: [
                        0.5, // Base multiplier
                        {
                          $multiply: [
                            0.05, // 5% increase per severity point
                            {
                              $switch: {
                                branches: [
                                  { case: { $eq: ['$urgency', 'low'] }, then: 2 },
                                  { case: { $eq: ['$urgency', 'medium'] }, then: 5 },
                                  { case: { $eq: ['$urgency', 'high'] }, then: 8 },
                                  { case: { $eq: ['$urgency', 'critical'] }, then: 10 }
                                ],
                                default: 5
                              }
                            }
                          ]
                        }
                      ]
                    },
                    // Adjust for governorate-specific cost factors (e.g., urban vs rural)
                    {
                      $cond: {
                        if: {
                          $in: [
                            '$location.governorate',
                            ['Cairo', 'Alexandria', 'Giza']
                          ]
                        },
                        then: 1.2, // 20% higher in major cities
                        else: 1.0
                      }
                    }
                  ]
                },
                0 // Round to whole number
              ]
            }
          }
        },
        {
          $group: {
            _id: '$category',
            avgSeverityScore: { $avg: '$severityScore' },
            maxSeverityScore: { $max: '$severityScore' },
            minSeverityScore: { $min: '$severityScore' },
            avgRepairCost: { $avg: '$estimatedRepairCost' },
            totalEstimatedCost: { $sum: '$estimatedRepairCost' },
            reportCount: { $sum: 1 }
          }
        },
        {
          $project: {
            category: '$_id',
            avgSeverityScore: { $round: ['$avgSeverityScore', 2] },
            maxSeverityScore: 1,
            minSeverityScore: 1,
            avgRepairCost: { $round: ['$avgRepairCost', 2] },
            totalEstimatedCost: 1,
            reportCount: 1,
            costPerReport: { $round: [{ $divide: ['$totalEstimatedCost', '$reportCount'] }, 2] },
            _id: 0
          }
        },
        { $sort: { avgSeverityScore: -1 } }
      ];

      return await ReportModel.aggregate(pipeline);
    } catch (error) {
      logger.error(`Error calculating damage assessment metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build base match query for filtering reports
   * @param {Object} filters - Query filters
   * @returns {Object} MongoDB match stage query
   * @private
   */
  _buildBaseMatchQuery(filters) {
    const match = {};
    
    // Date range filtering
    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      
      if (filters.startDate) {
        match.createdAt.$gte = new Date(filters.startDate);
      }
      
      if (filters.endDate) {
        match.createdAt.$lte = new Date(filters.endDate);
      }
    }
    
    // Category filtering
    if (filters.category) {
      match.category = filters.category;
    }
    
    // Location filtering
    if (filters.governorate) {
      match['location.governorate'] = filters.governorate;
    }
    
    if (filters.city) {
      match['location.city'] = filters.city;
    }
    
    // Urgency filtering
    if (filters.urgency) {
      match.urgency = filters.urgency;
    }
    
    // Status filtering
    if (filters.status) {
      match.status = filters.status;
    }
    
    return match;
  }
}

export default new AnalyticsService(); 