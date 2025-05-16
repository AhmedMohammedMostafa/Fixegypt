import Report from '../../../domain/entities/Report.js';
import { ApiError } from '../../../infrastructure/web/middlewares/errorHandler.js';

/**
 * Use case for creating a new report
 */
class CreateReportUseCase {
  constructor(reportRepository, userRepository, aiService) {
    this.reportRepository = reportRepository;
    this.userRepository = userRepository;
    this.aiService = aiService;
  }

  /**
   * Execute the use case
   * @param {Object} reportData - Report data
   * @param {string} userId - User ID creating the report
   * @param {Array<string>} imageFiles - Paths to uploaded image files
   * @returns {Promise<Report>} Created report
   */
  async execute(reportData, userId, imageFiles = []) {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // If user is not verified, they can't create reports
    if (!user.isVerified) {
      throw new ApiError(403, 'Your account needs to be verified before submitting reports');
    }

    // Process images if provided
    const images = imageFiles.map(file => ({
      url: file,
      uploadedAt: new Date()
    }));

    // Ensure userId is stored as a string (ID), not an object
    const userIdString = typeof userId === 'object' ? 
      (userId.id || userId._id || userId.toString()) : 
      userId.toString();

    // Make sure adminId is null initially (set later when an admin processes the report)
    const adminId = null;

    // Create report entity
    const report = new Report({
      ...reportData,
      userId: userIdString,
      adminId,
      images,
      status: 'pending',
      urgency: reportData.urgency || 'medium'
    });

    // Save report to repository
    const createdReport = await this.reportRepository.create(report);

    // Process with AI service if images provided (asynchronously)
    if (images.length > 0) {
      this.processImagesWithAI(createdReport);
    }

    return createdReport;
  }

  /**
   * Process report images with AI service
   * This is done asynchronously to not block the report creation
   * @param {Report} report - Created report
   */
  async processImagesWithAI(report) {
    try {
      if (report.images.length === 0) return;

      // Get first image for analysis
      const primaryImage = report.images[0].url;

      // Analyze image for classification
      const classificationResult = await this.aiService.analyzeImage(primaryImage);
      
      // Detect urgency from report description and image
      const urgencyResult = await this.aiService.detectUrgency(
        report.description, 
        primaryImage
      );

      // Update report with AI analysis
      const aiAnalysis = {
        classification: classificationResult.classification,
        urgency: urgencyResult.urgency,
        confidence: classificationResult.confidence,
        analysisTimestamp: new Date()
      };

      // Update the report with AI analysis results
      await this.reportRepository.update(report.id, { 
        aiAnalysis,
        // Update urgency only if AI is more confident in a higher urgency level
        ...(this.shouldUpdateUrgency(report.urgency, urgencyResult.urgency, urgencyResult.confidence) ? 
          { urgency: urgencyResult.urgency } : {})
      });
    } catch (error) {
      // Log error but don't block report creation
      console.error('AI processing error:', error);
    }
  }

  /**
   * Determine if report urgency should be updated based on AI analysis
   * @param {string} currentUrgency - Current urgency level
   * @param {string} aiUrgency - AI detected urgency level
   * @param {number} confidence - AI confidence level (0-1)
   * @returns {boolean} Whether urgency should be updated
   */
  shouldUpdateUrgency(currentUrgency, aiUrgency, confidence) {
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

export default CreateReportUseCase; 