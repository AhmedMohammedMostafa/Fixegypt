/**
 * Use case for awarding points when a report is submitted
 */
class AwardPointsForReportSubmissionUseCase {
  constructor(pointsRepository, userRepository, reportRepository) {
    this.pointsRepository = pointsRepository;
    this.userRepository = userRepository;
    this.reportRepository = reportRepository;
  }

  /**
   * Execute the use case
   * @param {string} reportId - Report ID
   * @returns {Promise<Object>} Result with user, points, and transaction
   */
  async execute(reportId) {
    // Find the report
    const report = await this.reportRepository.findById(reportId);
    
    // Find the report owner
    const user = await this.userRepository.findById(report.userId);
    
    // Add points to user - fixed amount for submission
    const pointsAmount = 25;
    
    // Add points to user
    const result = await this.pointsRepository.addPoints(
      user.id,
      pointsAmount,
      'report_submission',
      reportId,
      `Points awarded for submitting report: ${report.title}`
    );
    
    return {
      user: result.user,
      pointsAwarded: pointsAmount,
      transaction: result.transaction
    };
  }
}

export default AwardPointsForReportSubmissionUseCase; 