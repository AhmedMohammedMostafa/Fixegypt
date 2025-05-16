import ReportRepository from '../../../domain/repositories/ReportRepository.js';
import ReportModel from '../models/ReportModel.js';
import Report from '../../../domain/entities/Report.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * MongoDB implementation of ReportRepository
 */
class MongoReportRepository extends ReportRepository {
  /**
   * Convert image file path to base64 string
   * @param {string} imagePath - Path to the image file
   * @returns {string|null} Base64 encoded image or null if error
   */
  _convertImageToBase64(imagePath) {
    try {
      // Handle both absolute and relative paths
      let fullPath = imagePath;
      
      // Check if path is a URL or base64 already
      if (imagePath.startsWith('data:image') || imagePath.startsWith('http')) {
        return imagePath;
      }
      
      // If path starts with /uploads, construct path relative to project root
      if (imagePath.startsWith('/uploads')) {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const projectRoot = path.resolve(__dirname, '../../../../');
        fullPath = path.join(projectRoot, imagePath);
      }
      
      // Read file and convert to base64
      if (fs.existsSync(fullPath)) {
        const imageBuffer = fs.readFileSync(fullPath);
        const base64Image = imageBuffer.toString('base64');
        
        // Get file extension for proper MIME type
        const ext = path.extname(fullPath).toLowerCase();
        let mimeType = 'image/jpeg'; // Default
        
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';
        
        return `data:${mimeType};base64,${base64Image}`;
      }
      
      console.error(`Image file not found: ${fullPath}`);
      return null;
    } catch (error) {
      console.error(`Error converting image to base64: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Process report images to convert paths to base64
   * @param {Object} reportObject - Report object with images
   * @returns {Object} Report with processed images
   */
  _processReportImages(reportObject) {
    if (!reportObject || !reportObject.images || !Array.isArray(reportObject.images)) {
      return reportObject;
    }
    
    // Make a copy to avoid modifying the original
    const processedReport = { ...reportObject };
    
    // Process each image
    processedReport.images = reportObject.images.map(image => {
      // If image is already an object with url property
      if (image && typeof image === 'object' && image.url) {
        const base64Url = this._convertImageToBase64(image.url);
        return {
          ...image,
          url: base64Url || image.url // Fall back to original URL if conversion fails
        };
      }
      
      // If image is just a string URL
      if (typeof image === 'string') {
        const base64Url = this._convertImageToBase64(image);
        return {
          url: base64Url || image,
          uploadedAt: new Date()
        };
      }
      
      return image; // Return as is if can't process
    });
    
    return processedReport;
  }

  /**
   * Map database report to domain entity
   * @param {Object} dbReport - Database report object
   * @returns {Report} Domain report entity
   */
  _mapToDomainEntity(dbReport) {
    if (!dbReport) return null;
    
    // Convert Mongoose document to plain object if needed
    const reportObject = dbReport.toObject ? dbReport.toObject() : dbReport;
    
    // Process images to convert to base64
    const processedReport = this._processReportImages(reportObject);
    
    // Safely convert IDs to strings, handling cases where they might be undefined
    // For MongoDB, _id is always present but id might not be
    let idString;
    if (processedReport.id) {
      idString = typeof processedReport.id === 'string' 
        ? processedReport.id 
        : (typeof processedReport.id.toString === 'function' 
            ? processedReport.id.toString() 
            : String(processedReport.id));
    } else if (processedReport._id) {
      idString = typeof processedReport._id === 'string' 
        ? processedReport._id 
        : (typeof processedReport._id.toString === 'function' 
            ? processedReport._id.toString() 
            : String(processedReport._id));
    } else {
      console.warn('Report has no id or _id property:', processedReport);
      idString = null;
    }
    
    // Handle cases where userId might be populated with a user object
    let userIdString;
    if (!processedReport.userId) {
      userIdString = null;
    } else if (typeof processedReport.userId === 'object' && (processedReport.userId.id || processedReport.userId._id)) {
      // If userId is a populated object, extract the ID
      userIdString = processedReport.userId.id || processedReport.userId._id;
      userIdString = typeof userIdString === 'string' 
        ? userIdString 
        : (typeof userIdString.toString === 'function' 
            ? userIdString.toString() 
            : String(userIdString));
    } else {
      // Regular case where userId is a string or ObjectId
      userIdString = typeof processedReport.userId === 'string' 
        ? processedReport.userId 
        : (typeof processedReport.userId.toString === 'function' 
            ? processedReport.userId.toString() 
            : String(processedReport.userId));
    }
    
    // Handle cases where adminId might be populated with a user object
    let adminIdString = null;
    if (processedReport.adminId) {
      if (typeof processedReport.adminId === 'object' && (processedReport.adminId.id || processedReport.adminId._id)) {
        // If adminId is a populated object, extract the ID
        adminIdString = processedReport.adminId.id || processedReport.adminId._id;
        adminIdString = typeof adminIdString === 'string' 
          ? adminIdString 
          : (typeof adminIdString.toString === 'function' 
              ? adminIdString.toString() 
              : String(adminIdString));
      } else {
        // Regular case where adminId is a string or ObjectId
        adminIdString = typeof processedReport.adminId === 'string' 
          ? processedReport.adminId 
          : (typeof processedReport.adminId.toString === 'function' 
              ? processedReport.adminId.toString() 
              : String(processedReport.adminId));
      }
    }
    
    // Ensure aiAnalysis is properly structured
    const aiAnalysis = processedReport.aiAnalysis || {};
    
    // Ensure confidence is a number if present
    if (aiAnalysis.confidence && typeof aiAnalysis.confidence !== 'number') {
      try {
        aiAnalysis.confidence = parseFloat(aiAnalysis.confidence);
        if (isNaN(aiAnalysis.confidence)) aiAnalysis.confidence = 0.5;
      } catch (e) {
        aiAnalysis.confidence = 0.5;
      }
    }
    
    console.log('Mapping report from DB:', {
      dbId: processedReport._id,
      mappedId: idString,
      userId: userIdString,
      adminId: adminIdString,
      hasAiAnalysis: !!aiAnalysis && Object.keys(aiAnalysis).length > 0
    });
    
    return new Report({
      id: idString,
      title: processedReport.title,
      description: processedReport.description,
      category: processedReport.category,
      location: processedReport.location,
      images: processedReport.images,
      status: processedReport.status,
      urgency: processedReport.urgency,
      userId: userIdString,
      adminId: adminIdString,
      aiAnalysis: aiAnalysis,
      statusHistory: processedReport.statusHistory || [],
      createdAt: processedReport.createdAt,
      updatedAt: processedReport.updatedAt
    });
  }

  /**
   * Create a new report
   * @param {Report} report - Report entity
   * @returns {Promise<Report>} Created report
   */
  async create(report) {
    try {
      console.log('Creating report with data:', {
        title: report.title,
        description: `${report.description.substring(0, 20)}...`,
        category: report.category,
        userId: report.userId,
        location: report.location
      });
      
      // Ensure userId is a string, not an object
      const userId = typeof report.userId === 'object' 
        ? (report.userId.id || report.userId._id || report.userId.toString()) 
        : report.userId;
      
      // Ensure adminId is null initially or a proper string
      const adminId = report.adminId === null ? null : (
        typeof report.adminId === 'object'
          ? (report.adminId.id || report.adminId._id || report.adminId.toString())
          : report.adminId
      );
      
      const dbReport = new ReportModel({
        title: report.title,
        description: report.description,
        category: report.category,
        location: report.location,
        images: report.images,
        status: report.status || 'pending',
        urgency: report.urgency || 'medium',
        userId: userId,
        adminId: adminId,
        aiAnalysis: report.aiAnalysis || {},
        statusHistory: report.statusHistory || [{
          status: report.status || 'pending',
          timestamp: new Date(),
          note: 'Report created'
        }]
      });

      const savedReport = await dbReport.save();
      console.log('Report saved with ID:', savedReport._id);
      return this._mapToDomainEntity(savedReport);
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  /**
   * Find a report by ID
   * @param {string} id - Report ID
   * @returns {Promise<Report|null>} Found report or null
   */
  async findById(id) {
    try {
      console.log(`Finding report with ID: ${id}`);
      
      if (!id) {
        console.error('Null or undefined ID provided to findById');
        return null;
      }
      
      let report;
      
      // Try finding by MongoDB _id first
      try {
        report = await ReportModel.findById(id)
          .populate('userId', 'firstName lastName email nationalId')
          .populate('adminId', 'firstName lastName email');
      } catch (idError) {
        console.log(`Error finding by MongoDB ID (${id}):`, idError.message);
      }
      
      // If not found, try as a string ID property
      if (!report) {
        report = await ReportModel.findOne({ _id: id })
          .populate('userId', 'firstName lastName email nationalId')
          .populate('adminId', 'firstName lastName email');
      }
      
      if (!report) {
        console.log(`No report found with ID: ${id}`);
        return null;
      }
      
      console.log(`Found report: ${report._id}, status: ${report.status}`);
      return this._mapToDomainEntity(report);
    } catch (error) {
      console.error(`Error in findById(${id}):`, error);
      throw error;
    }
  }

  /**
   * Update a report
   * @param {string} id - Report ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Report>} Updated report
   */
  async update(id, updateData) {
    const updatedReport = await ReportModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    return this._mapToDomainEntity(updatedReport);
  }

  /**
   * Delete a report
   * @param {string} id - Report ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const result = await ReportModel.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * List reports with pagination and filtering
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<{reports: Report[], total: number, page: number, limit: number}>} Paginated reports
   */
  async findAll(options = { page: 1, limit: 10, filter: {} }) {
    const { page, limit, filter } = options;
    const skip = (page - 1) * limit;

    // Process filters for the query
    const query = {};
    
    if (filter.status) query.status = filter.status;
    if (filter.category) query.category = filter.category;
    if (filter.urgency) query.urgency = filter.urgency;
    if (filter.governorate) query['location.governorate'] = filter.governorate;
    if (filter.city) query['location.city'] = filter.city;
    if (filter.startDate) query.createdAt = { $gte: new Date(filter.startDate) };
    if (filter.endDate) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(filter.endDate);
    }
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } }
      ];
    }

    const [reports, total] = await Promise.all([
      ReportModel.find(query)
        .sort(filter.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email')
        .populate('adminId', 'firstName lastName email'),
      ReportModel.countDocuments(query)
    ]);

    return {
      reports: reports.map(report => this._mapToDomainEntity(report)),
      total,
      page,
      limit
    };
  }

  /**
   * Find reports by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<{reports: Report[], total: number, page: number, limit: number}>} User's reports
   */
  async findByUserId(userId, options = { page: 1, limit: 10 }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      ReportModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReportModel.countDocuments({ userId })
    ]);

    return {
      reports: reports.map(report => this._mapToDomainEntity(report)),
      total,
      page,
      limit
    };
  }

  /**
   * Update a report's status
   * @param {string} id - Report ID
   * @param {string} status - New status
   * @param {string} adminId - Admin ID making the update
   * @param {string} note - Optional note about the update
   * @returns {Promise<Report>} Updated report
   */
  async updateStatus(id, status, adminId, note = '') {
    try {
      console.log(`Repository: Updating report with ID ${id} to status ${status} by admin ${adminId}`);
      
      // Normalize the report ID to handle different formats
      let normalizedId;
      try {
        // If it's a MongoDB ObjectId string, use it directly
        const mongoose = (await import('mongoose')).default;
        if (mongoose.Types.ObjectId.isValid(id)) {
          normalizedId = new mongoose.Types.ObjectId(id);
        } else {
          // Otherwise, treat as a string ID
          normalizedId = id;
        }
      } catch (error) {
        console.error('Error normalizing report ID:', error);
        normalizedId = id; // Use as-is if error
      }
      
      // Ensure adminId is properly formatted
      let normalizedAdminId = null;
      if (adminId) {
        try {
          // If it's a MongoDB ObjectId string, convert it to ObjectId
          const mongoose = (await import('mongoose')).default;
          if (mongoose.Types.ObjectId.isValid(adminId)) {
            normalizedAdminId = new mongoose.Types.ObjectId(adminId);
          } else if (typeof adminId === 'object' && (adminId.id || adminId._id)) {
            // If it's an object with id, extract that
            const adminObjId = adminId.id || adminId._id;
            if (mongoose.Types.ObjectId.isValid(adminObjId)) {
              normalizedAdminId = new mongoose.Types.ObjectId(adminObjId);
            } else {
              normalizedAdminId = adminObjId;
            }
          } else {
            // Use as string
            normalizedAdminId = adminId;
          }
        } catch (error) {
          console.error('Error normalizing admin ID:', error);
          normalizedAdminId = adminId; // Use as-is if error
        }
      }
      
      // Try to find the report, handling potential MongoDB ID format issues
      let report;
      try {
        // First try by MongoDB ObjectId (most common case)
        report = await ReportModel.findById(normalizedId);
      } catch (findError) {
        console.error(`Error finding report with ID ${id}:`, findError.message);
      }
      
      // If not found, try alternative approaches
      if (!report) {
        try {
          // Try as string ID
          report = await ReportModel.findOne({ id: id });
        } catch (findError) {
          console.error(`Error finding report with string ID ${id}:`, findError.message);
        }
      }
      
      if (!report) {
        console.error(`Report with ID ${id} not found`);
        throw new Error('Report not found');
      }
      
      console.log(`Found report with ID ${report._id}, original status: ${report.status}`);
      
      // Update report fields
      report.status = status;
      report.adminId = normalizedAdminId;
      report.updatedAt = new Date();
      
      // Add status update to history
      if (!report.statusHistory) {
        report.statusHistory = [];
      }
      
      report.statusHistory.push({
        status,
        changedBy: normalizedAdminId,
        changedAt: new Date(),
        note: note || undefined
      });
      
      // Save the report
      const updatedReport = await report.save();
      console.log(`Successfully updated report status. Report ID: ${updatedReport._id}, new status: ${updatedReport.status}`);
      
      // Return processed report entity
      return this._mapToDomainEntity(updatedReport);
    } catch (error) {
      console.error(`Error updating report status for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add images to a report
   * @param {string} id - Report ID
   * @param {Array<string>} imageUrls - Image URLs to add
   * @returns {Promise<Report>} Updated report
   */
  async addImages(id, imageUrls) {
    const imagesToAdd = imageUrls.map(url => ({
      url,
      uploadedAt: new Date()
    }));

    const updatedReport = await ReportModel.findByIdAndUpdate(
      id,
      {
        $push: { images: { $each: imagesToAdd } },
        updatedAt: new Date()
      },
      { new: true }
    );

    return this._mapToDomainEntity(updatedReport);
  }

  /**
   * Get reports by location
   * @param {Object} coordinates - Location coordinates (lat, lng)
   * @param {number} radius - Search radius in kilometers
   * @param {Object} options - Pagination options
   * @returns {Promise<{reports: Report[], total: number}>} Found reports
   */
  async findByLocation(coordinates, radius, options = { page: 1, limit: 10 }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    // Convert kilometers to radians (Earth's radius is approximately 6371 km)
    const radiusInRadians = radius / 6371;

    // Query for reports within the radius
    const query = {
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [
            [coordinates.lng, coordinates.lat],
            radiusInRadians
          ]
        }
      }
    };

    const [reports, total] = await Promise.all([
      ReportModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReportModel.countDocuments(query)
    ]);

    return {
      reports: reports.map(report => this._mapToDomainEntity(report)),
      total,
      page,
      limit
    };
  }

  /**
   * Get reports statistics
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Report statistics
   */
  async getStatistics(filter = {}) {
    // Process filters for the query
    const query = {};
    
    if (filter.governorate) query['location.governorate'] = filter.governorate;
    if (filter.city) query['location.city'] = filter.city;
    if (filter.startDate) query.createdAt = { $gte: new Date(filter.startDate) };
    if (filter.endDate) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(filter.endDate);
    }

    // Get various statistics in parallel
    const [
      totalReports,
      statusCounts,
      categoryCounts,
      governorateCounts,
      urgencyCounts,
      avgResolutionTime
    ] = await Promise.all([
      ReportModel.countDocuments(query),
      this.getCountsByStatus(query),
      this.getCountsByCategory(query),
      this.getCountsByGovernorate(query),
      this.getCountsByUrgency(query),
      this.getAverageResolutionTime(query)
    ]);

    return {
      totalReports,
      statusCounts,
      categoryCounts,
      governorateCounts,
      urgencyCounts,
      avgResolutionTime
    };
  }

  /**
   * Get report counts by status
   * @param {Object} baseQuery - Base query to filter reports
   * @returns {Promise<Object>} Counts by status
   */
  async getCountsByStatus(baseQuery = {}) {
    const aggregation = await ReportModel.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Convert to an object with status keys
    const result = {};
    aggregation.forEach(item => {
      result[item._id] = item.count;
    });

    // Ensure all statuses are represented
    const allStatuses = ['pending', 'in-progress', 'resolved', 'rejected'];
    allStatuses.forEach(status => {
      if (!result[status]) result[status] = 0;
    });

    return result;
  }

  /**
   * Get report counts by category
   * @param {Object} baseQuery - Base query to filter reports
   * @returns {Promise<Object>} Counts by category
   */
  async getCountsByCategory(baseQuery = {}) {
    const aggregation = await ReportModel.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Convert to an object with category keys
    const result = {};
    aggregation.forEach(item => {
      result[item._id] = item.count;
    });

    return result;
  }

  /**
   * Get report counts by governorate
   * @param {Object} baseQuery - Base query to filter reports
   * @returns {Promise<Object>} Counts by governorate
   */
  async getCountsByGovernorate(baseQuery = {}) {
    const aggregation = await ReportModel.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$location.governorate', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Convert to an object with governorate keys
    const result = {};
    aggregation.forEach(item => {
      result[item._id] = item.count;
    });

    return result;
  }

  /**
   * Get report counts by urgency
   * @param {Object} baseQuery - Base query to filter reports
   * @returns {Promise<Object>} Counts by urgency
   */
  async getCountsByUrgency(baseQuery = {}) {
    const aggregation = await ReportModel.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$urgency', count: { $sum: 1 } } }
    ]);

    // Convert to an object with urgency keys
    const result = {};
    aggregation.forEach(item => {
      result[item._id] = item.count;
    });

    // Ensure all urgency levels are represented
    const allUrgencies = ['low', 'medium', 'high', 'critical'];
    allUrgencies.forEach(urgency => {
      if (!result[urgency]) result[urgency] = 0;
    });

    return result;
  }

  /**
   * Get average resolution time for reports
   * @param {Object} baseQuery - Base query to filter reports
   * @returns {Promise<number>} Average resolution time in days
   */
  async getAverageResolutionTime(baseQuery = {}) {
    // Find resolved reports
    const resolvedReportsQuery = {
      ...baseQuery,
      status: 'resolved'
    };

    const resolvedReports = await ReportModel.find(resolvedReportsQuery);
    
    if (resolvedReports.length === 0) {
      return 0;
    }

    // Calculate resolution time for each report
    let totalResolutionTimeMs = 0;
    
    resolvedReports.forEach(report => {
      const creationDate = new Date(report.createdAt);
      
      // Find when the report was marked as resolved
      const resolutionEvent = report.statusHistory.find(
        event => event.status === 'resolved'
      );
      
      if (resolutionEvent) {
        const resolutionDate = new Date(resolutionEvent.timestamp);
        totalResolutionTimeMs += resolutionDate - creationDate;
      }
    });

    // Calculate average (convert from ms to days)
    const avgResolutionTimeMs = totalResolutionTimeMs / resolvedReports.length;
    const avgResolutionTimeDays = avgResolutionTimeMs / (1000 * 60 * 60 * 24);
    
    return parseFloat(avgResolutionTimeDays.toFixed(2));
  }
}

export default MongoReportRepository; 