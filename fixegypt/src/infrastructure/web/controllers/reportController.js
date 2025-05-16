import CreateReportUseCase from '../../../application/use-cases/report/CreateReportUseCase.js';
import MongoReportRepository from '../../persistence/repositories/MongoReportRepository.js';
import MongoUserRepository from '../../persistence/repositories/MongoUserRepository.js';
import aiService from '../../ai/AIService.js';
import emailService from '../../email/EmailService.js';
import { getUploadedFilePaths } from '../middlewares/uploadMiddleware.js';
import { ApiError } from '../middlewares/errorHandler.js';

// Create instances of required dependencies
const reportRepository = new MongoReportRepository();
const userRepository = new MongoUserRepository();

/**
 * ReportController provides handlers for report-related routes
 */
class ReportController {
  constructor() {
    // Bind methods to ensure 'this' context is preserved
    this.createReport = this.createReport.bind(this);
    this.getReports = this.getReports.bind(this);
    this.getReportById = this.getReportById.bind(this);
    this.updateReport = this.updateReport.bind(this);
    this.updateReportStatus = this.updateReportStatus.bind(this);
    this.deleteReport = this.deleteReport.bind(this);
    this.addImagesToReport = this.addImagesToReport.bind(this);
    this.getUserReports = this.getUserReports.bind(this);
    this.getReportStatistics = this.getReportStatistics.bind(this);
    this.getNearbyReports = this.getNearbyReports.bind(this);
    this._processReportWithAI = this._processReportWithAI.bind(this);
    this._shouldUpdateUrgency = this._shouldUpdateUrgency.bind(this);
  }

  /**
   * Create a new report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async createReport(req, res, next) {
    try {
      // Make sure we have a valid user ID
      if (!req.user || !req.user.id) {
        throw new ApiError(401, 'User authentication required to create a report');
      }
      
      const userId = req.user.id;
      console.log('Creating report for user ID:', userId);
      
      // Check if user is verified
      if (!req.user.isVerified) {
        throw new ApiError(403, 'You must verify your email before submitting reports');
      }
      
      const { title, description, category, location, locationJson } = req.body;
      const imagePaths = getUploadedFilePaths(req);
      
      // Handle location data - could be string or object
      let locationData;
      
      try {
        // Log the incoming location data for debugging
        console.log('Received location data:', {
          location: location,
          locationJson: locationJson,
          locationFields: {
            address: req.body['location[address]'],
            city: req.body['location[city]'],
            governorate: req.body['location[governorate]'],
            coordinatesLat: req.body['location[coordinates][lat]'],
            coordinatesLng: req.body['location[coordinates][lng]']
          }
        });
        
        // If we have locationJson field (from frontend), try to use it first
        if (locationJson) {
          locationData = JSON.parse(locationJson);
        }
        // If location is a string, parse it
        else if (location && typeof location === 'string') {
          locationData = JSON.parse(location);
        } 
        // If location is already an object, use it directly
        else if (location && typeof location === 'object') {
          locationData = location;
        }
        // Handle the case where location data might be nested differently
        else if (req.body['location[coordinates][lat]']) {
          // Build from individual fields (used by some frontend implementations)
          locationData = {
            address: req.body['location[address]'] || '',
            city: req.body['location[city]'] || '',
            governorate: req.body['location[governorate]'] || '',
            coordinates: {
              lat: parseFloat(req.body['location[coordinates][lat]']) || 0,
              lng: parseFloat(req.body['location[coordinates][lng]']) || 0
            }
          };
        } else {
          throw new ApiError(400, 'Invalid location data');
        }
      } catch (error) {
        console.error('Error parsing location data:', error);
        throw new ApiError(400, 'Invalid location format');
      }
      
      // Validate required location fields
      if (!locationData || 
          !locationData.coordinates || 
          !locationData.coordinates.lat || 
          !locationData.coordinates.lng) {
        throw new ApiError(400, 'Location coordinates are required');
      }
      
      // Ensure coordinates are numbers
      locationData.coordinates.lat = parseFloat(locationData.coordinates.lat);
      locationData.coordinates.lng = parseFloat(locationData.coordinates.lng);
      
      if (isNaN(locationData.coordinates.lat) || isNaN(locationData.coordinates.lng)) {
        throw new ApiError(400, 'Invalid coordinates format');
      }
      
      // Create report - IMPORTANT: Always use req.user.id, not any userId from the request body
      const report = await reportRepository.create({
        title,
        description,
        category,
        location: locationData,
        images: imagePaths.map(path => ({
          url: path,
          uploadedAt: new Date()
        })),
        userId: userId // Always use the authenticated user's ID from req.user
      });
      
      // Process with AI if images provided
      if (imagePaths.length > 0) {
        try {
          // Process asynchronously to not block the response
          setTimeout(async () => {
            try {
              // Pass the first image path
              const firstImageObj = {
                url: imagePaths[0],
                uploadedAt: new Date()
              };
              await this._processReportWithAI(report, firstImageObj);
              console.log('AI processing completed for report:', report.id);
            } catch (innerError) {
              console.error('Error in async AI processing:', innerError);
            }
          }, 100);
        } catch (aiError) {
          console.error('Error setting up AI processing:', aiError);
          // Continue with report creation even if AI processing fails
        }
      }
      
      // Award points for report submission
      try {
        // Import use case locally to avoid circular dependencies
        const AwardPointsForReportSubmissionUseCase = (await import('../../../application/use-cases/points/AwardPointsForReportSubmissionUseCase.js')).default;
        const MongoPointsRepository = (await import('../../persistence/repositories/MongoPointsRepository.js')).default;
        
        const pointsRepository = new MongoPointsRepository();
        const awardPointsUseCase = new AwardPointsForReportSubmissionUseCase(
          pointsRepository,
          userRepository,
          reportRepository
        );
        
        // Award points (don't wait for this to complete)
        setTimeout(async () => {
          try {
            const result = await awardPointsUseCase.execute(report.id);
            console.log('Points awarded for report submission:', report.id, 'Amount:', result.pointsAwarded);
          } catch (error) {
            console.error('Error awarding points for submission:', error);
          }
        }, 200);
      } catch (error) {
        console.error('Error importing award points for submission use case:', error);
      }
      
      // Return result
      res.status(201).json({
        status: 'success',
        message: 'Report created successfully',
        data: {
          report
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all reports with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getReports(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        category, 
        urgency,
        governorate,
        city,
        startDate,
        endDate,
        search,
        sort = '-createdAt'
      } = req.query;
      
      // Build filter object
      const filter = {};
      
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (urgency) filter.urgency = urgency;
      if (governorate) filter.governorate = governorate;
      if (city) filter.city = city;
      if (startDate) filter.startDate = startDate;
      if (endDate) filter.endDate = endDate;
      if (search) filter.search = search;
      
      // Add sort option
      let sortOption = {};
      if (sort.startsWith('-')) {
        sortOption[sort.substring(1)] = -1;
      } else {
        sortOption[sort] = 1;
      }
      filter.sort = sortOption;
      
      // If user is not admin, only show their reports
      if (req.user && req.user.role !== 'admin') {
        filter.userId = req.user.id;
      }
      
      // Get reports
      const result = await reportRepository.findAll({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        filter
      });
      
      // Process reports to include user details
      const processedReports = await Promise.all(result.reports.map(async (report) => {
        try {
          // If userId exists, fetch user details
          if (report.userId) {
            const user = await userRepository.findById(report.userId);
            if (user) {
              return {
                ...report,
                userDetails: {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  role: user.role,
                  isVerified: user.isVerified
                }
              };
            }
          }
          return report;
        } catch (error) {
          console.error(`Error fetching user details for report ${report.id}:`, error);
          return report;
        }
      }));
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Reports retrieved successfully',
        data: {
          reports: processedReports,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: Math.ceil(result.total / result.limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a report by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getReportById(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get report
      const report = await reportRepository.findById(id);
      
      if (!report) {
        throw new ApiError(404, 'Report not found');
      }
      
      // Check if user is authorized to view this report
      if (req.user.role !== 'admin' && report.userId.toString() !== req.user.id) {
        throw new ApiError(403, 'You are not authorized to view this report');
      }
      
      // Add user details if userId exists
      let reportWithUserDetails = { ...report };
      if (report.userId) {
        try {
          const user = await userRepository.findById(report.userId);
          if (user) {
            reportWithUserDetails.userDetails = {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              isVerified: user.isVerified
            };
          }
        } catch (error) {
          console.error(`Error fetching user details for report ${report.id}:`, error);
        }
      }
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Report retrieved successfully',
        data: {
          report: reportWithUserDetails
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateReport(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Get existing report
      const report = await reportRepository.findById(id);
      
      if (!report) {
        throw new ApiError(404, 'Report not found');
      }
      
      // Check if user is authorized to update this report
      if (req.user.role !== 'admin' && report.userId.toString() !== req.user.id) {
        throw new ApiError(403, 'You are not authorized to update this report');
      }
      
      // Citizen can only update certain fields if report is pending
      if (req.user.role !== 'admin') {
        if (report.status !== 'pending') {
          throw new ApiError(403, 'You can only edit reports with pending status');
        }
        
        // Filter allowed fields for citizens
        const allowedFields = ['title', 'description', 'category', 'location'];
        const filteredUpdateData = {};
        
        Object.keys(updateData).forEach(key => {
          if (allowedFields.includes(key)) {
            filteredUpdateData[key] = updateData[key];
          }
        });
        
        updateData = filteredUpdateData;
      }
      
      // Update report
      const updatedReport = await reportRepository.update(id, {
        ...updateData,
        updatedAt: new Date()
      });
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Report updated successfully',
        data: {
          report: updatedReport
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
      const { id } = req.params;
      const { status, note } = req.body;
      const adminId = req.user.id;
      
      // Ensure we have a valid admin ID
      if (!adminId) {
        throw new ApiError(401, 'Admin authentication required to update report status');
      }
      
      console.log(`Updating report ${id} status to ${status} by admin ${adminId}`);
      
      // Get existing report
      const report = await reportRepository.findById(id);
      
      if (!report) {
        throw new ApiError(404, 'Report not found');
      }
      
      // Log the report ID for debugging
      console.log('Report found with ID:', report.id);
      
      // Check if status is changing to 'resolved'
      const isBeingResolved = report.status !== 'resolved' && status === 'resolved';
      
      // Update report status
      const updatedReport = await reportRepository.updateStatus(id, status, adminId, note);
      
      // Log the updated report ID for debugging
      console.log('Report successfully updated with ID:', updatedReport.id);
      
      // Get report owner
      const reportOwner = await userRepository.findById(report.userId);
      
      if (reportOwner) {
        // Send notification email
        try {
          await emailService.sendReportStatusUpdateEmail(reportOwner, updatedReport, status, note);
          console.log('Status update email sent to user:', reportOwner.id);
        } catch (emailError) {
          console.error('Error sending status update email:', emailError);
          // Continue processing even if email fails
        }
      }
      
      // Award points if report is being resolved
      if (isBeingResolved) {
        try {
          // Import use case locally to avoid circular dependencies
          const AwardPointsForReportUseCase = (await import('../../../application/use-cases/points/AwardPointsForReportUseCase.js')).default;
          const MongoPointsRepository = (await import('../../persistence/repositories/MongoPointsRepository.js')).default;
          
          const pointsRepository = new MongoPointsRepository();
          const awardPointsUseCase = new AwardPointsForReportUseCase(
            pointsRepository,
            userRepository,
            reportRepository
          );
          
          // Award points in a separate thread to avoid blocking the response
          setTimeout(async () => {
            try {
              const result = await awardPointsUseCase.execute(id, adminId);
              console.log('Points awarded for resolved report:', id, 'Amount:', result.pointsAwarded, 'User:', result.user.id);
            } catch (error) {
              console.error('Error awarding points for resolved report:', error);
            }
          }, 200);
        } catch (error) {
          console.error('Error importing award points use case:', error);
        }
      }
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Report status updated successfully',
        data: {
          report: updatedReport
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async deleteReport(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get existing report
      const report = await reportRepository.findById(id);
      
      if (!report) {
        throw new ApiError(404, 'Report not found');
      }
      
      // Check if user is authorized to delete this report
      if (req.user.role !== 'admin' && report.userId.toString() !== req.user.id) {
        throw new ApiError(403, 'You are not authorized to delete this report');
      }
      
      // Citizen can only delete reports with pending status
      if (req.user.role !== 'admin' && report.status !== 'pending') {
        throw new ApiError(403, 'You can only delete reports with pending status');
      }
      
      // Delete report
      await reportRepository.delete(id);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Report deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add images to a report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async addImagesToReport(req, res, next) {
    try {
      const { id } = req.params;
      const imagePaths = getUploadedFilePaths(req);
      
      if (imagePaths.length === 0) {
        throw new ApiError(400, 'No images provided');
      }
      
      // Get existing report
      const report = await reportRepository.findById(id);
      
      if (!report) {
        throw new ApiError(404, 'Report not found');
      }
      
      // Check if user is authorized to update this report
      if (req.user.role !== 'admin' && report.userId.toString() !== req.user.id) {
        throw new ApiError(403, 'You are not authorized to update this report');
      }
      
      // Citizen can only add images if report is pending
      if (req.user.role !== 'admin' && report.status !== 'pending') {
        throw new ApiError(403, 'You can only add images to reports with pending status');
      }
      
      // Add images to report
      const updatedReport = await reportRepository.addImages(id, imagePaths);
      
      // Process with AI if this is the first image
      if (report.images.length === 0 && imagePaths.length > 0) {
        try {
          // Create image object format
          const firstImageObj = {
            url: imagePaths[0],
            uploadedAt: new Date()
          };
          this._processReportWithAI(updatedReport, firstImageObj);
        } catch (aiError) {
          console.error('Error processing report with AI when adding images:', aiError);
          // Continue with the process even if AI processing fails
        }
      }
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Images added to report successfully',
        data: {
          report: updatedReport
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's reports
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getUserReports(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      // Get user reports
      const result = await reportRepository.findByUserId(
        userId,
        {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10)
        }
      );
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'User reports retrieved successfully',
        data: {
          reports: result.reports,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: Math.ceil(result.total / result.limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reports statistics (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getReportStatistics(req, res, next) {
    try {
      const { governorate, city, startDate, endDate } = req.query;
      
      // Build filter
      const filter = {};
      if (governorate) filter.governorate = governorate;
      if (city) filter.city = city;
      if (startDate) filter.startDate = startDate;
      if (endDate) filter.endDate = endDate;
      
      // Get statistics
      const statistics = await reportRepository.getStatistics(filter);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Report statistics retrieved successfully',
        data: {
          statistics
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get nearby reports
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getNearbyReports(req, res, next) {
    try {
      const { lat, lng, radius = 5, page = 1, limit = 10 } = req.query;
      
      // Get nearby reports
      const result = await reportRepository.findByLocation(
        { lat: parseFloat(lat), lng: parseFloat(lng) },
        parseFloat(radius),
        {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10)
        }
      );
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Nearby reports retrieved successfully',
        data: {
          reports: result.reports,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: Math.ceil(result.total / result.limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process report with AI (private method)
   * @param {Report} report - Report to process
   * @param {Object|string} imagePathObj - Path to image or image object with URL
   * @private
   */
  async _processReportWithAI(report, imagePathObj) {
    try {
      // If imagePath is a string, use it directly
      // If it's an object (after formatting), use the url property
      const imagePathToUse = typeof imagePathObj === 'string' 
        ? imagePathObj 
        : (imagePathObj && imagePathObj.url ? imagePathObj.url : null);
      
      if (!imagePathToUse) {
        console.error('Invalid image path for AI processing');
        return;
      }

      // Verify image file exists before processing
      try {
        // Use the fs module from path
        const fs = await import('fs');
        if (!fs.existsSync(imagePathToUse)) {
          console.error(`Image file does not exist at path: ${imagePathToUse}`);
          return;
        }
      } catch (fsError) {
        console.error('Error checking if image exists:', fsError);
        return;
      }
      
      console.log(`Processing image with AI: ${imagePathToUse}`);
      
      // Analyze image
      const imageAnalysis = await aiService.analyzeImage(imagePathToUse);
      console.log('Image analysis result:', imageAnalysis);
      
      // Detect urgency
      const urgencyAnalysis = await aiService.detectUrgency(report.description, imagePathToUse);
      console.log('Urgency analysis result:', urgencyAnalysis);
      
      // Update report with AI analysis
      const aiAnalysis = {
        classification: imageAnalysis.classification,
        urgency: urgencyAnalysis.urgency,
        confidence: imageAnalysis.confidence,
        analysisTimestamp: new Date()
      };
      
      console.log('Updating report with AI analysis:', aiAnalysis);
      
      await reportRepository.update(report.id, {
        aiAnalysis,
        // Update urgency only if AI is more confident in a higher urgency level
        ...(this._shouldUpdateUrgency(report.urgency, urgencyAnalysis.urgency, urgencyAnalysis.confidence) ? 
          { urgency: urgencyAnalysis.urgency } : {})
      });
      
      console.log('AI analysis completed successfully for report:', report.id);
    } catch (error) {
      console.error('Error processing report with AI:', error);
      // Log additional details about the error
      if (error.response) {
        console.error('AI service response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
  }

  /**
   * Determine if report urgency should be updated based on AI analysis
   * @param {string} currentUrgency - Current urgency level
   * @param {string} aiUrgency - AI detected urgency level
   * @param {number} confidence - AI confidence level (0-1)
   * @returns {boolean} Whether urgency should be updated
   * @private
   */
  _shouldUpdateUrgency(currentUrgency, aiUrgency, confidence) {
    // Map urgency levels to numerical values
    const urgencyMap = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };

    // Only upgrade urgency, never downgrade
    const currentValue = urgencyMap[currentUrgency] || 2; // Default to medium
    const aiValue = urgencyMap[aiUrgency] || 2; // Default to medium

    // Update if AI detects higher urgency with good confidence
    return aiValue > currentValue && confidence > 0.7;
  }
}

export default new ReportController(); 