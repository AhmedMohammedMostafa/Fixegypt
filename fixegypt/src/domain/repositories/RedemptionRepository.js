/**
 * Redemption Repository Interface
 * Defines methods for interacting with redemption-related data
 */
class RedemptionRepository {
  /**
   * Create a new redemption request
   * @param {Object} redemptionData - Redemption data
   * @returns {Promise<Object>} Created redemption
   */
  async create(redemptionData) {
    throw new Error('Method not implemented');
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
    throw new Error('Method not implemented');
  }

  /**
   * Find redemption by ID
   * @param {string} redemptionId - Redemption ID
   * @returns {Promise<Object>} Redemption
   */
  async findById(redemptionId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all redemptions with filtering and pagination
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} Redemptions and pagination info
   */
  async findAll(filter, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Find user's redemptions
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Redemptions and pagination info
   */
  async findByUserId(userId, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Get redemption statistics
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Redemption statistics
   */
  async getStatistics(filter) {
    throw new Error('Method not implemented');
  }
}

export default RedemptionRepository; 