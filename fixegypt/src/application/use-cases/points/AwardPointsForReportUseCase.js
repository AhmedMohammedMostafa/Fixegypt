/**
 * Use case for awarding points when a report is resolved
 */
class AwardPointsForReportUseCase {
  constructor(pointsRepository, userRepository, reportRepository) {
    this.pointsRepository = pointsRepository;
    this.userRepository = userRepository;
    this.reportRepository = reportRepository;
  }

  /**
   * Execute the use case
   * @param {string} reportId - Report ID
   * @param {string} adminId - Admin ID who resolved the report
   * @returns {Promise<Object>} Result with user, points, and transaction
   */
  async execute(reportId, adminId) {
    // Find the report
    const report = await this.reportRepository.findById(reportId);
    
    // Check if report is resolved
    if (report.status !== 'resolved') {
      throw new Error('Points can only be awarded for resolved reports');
    }
    
    // Find the report owner
    const user = await this.userRepository.findById(report.userId);
    
    // Calculate points based on report urgency
    const pointsMap = {
      'low': 50,
      'medium': 100,
      'high': 150,
      'critical': 200
    };
    
    const pointsAmount = pointsMap[report.urgency] || 100;
    
    // Add points to user
    const result = await this.pointsRepository.addPoints(
      user.id,
      pointsAmount,
      'report_resolved',
      reportId,
      `Points awarded for resolved report: ${report.title}`
    );
    
    return {
      user: result.user,
      pointsAwarded: pointsAmount,
      transaction: result.transaction
    };
  }
}

export default AwardPointsForReportUseCase; 