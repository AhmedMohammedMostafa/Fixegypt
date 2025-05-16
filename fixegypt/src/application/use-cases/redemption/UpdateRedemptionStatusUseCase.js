/**
 * Use case for updating redemption status
 */
class UpdateRedemptionStatusUseCase {
  constructor(redemptionRepository) {
    this.redemptionRepository = redemptionRepository;
  }

  /**
   * Execute the use case
   * @param {string} redemptionId - Redemption ID
   * @param {string} status - New status (processing, completed, rejected)
   * @param {string} adminId - Admin ID
   * @param {string} notes - Notes about the status change (optional)
   * @returns {Promise<Object>} Updated redemption
   */
  async execute(redemptionId, status, adminId, notes = '') {
    // Validate status
    if (!['processing', 'completed', 'rejected'].includes(status)) {
      throw new Error('Invalid status. Valid statuses are: processing, completed, rejected');
    }
    
    // Update redemption status
    const redemption = await this.redemptionRepository.updateStatus(
      redemptionId,
      status,
      adminId,
      notes
    );
    
    return redemption;
  }
}

export default UpdateRedemptionStatusUseCase; 