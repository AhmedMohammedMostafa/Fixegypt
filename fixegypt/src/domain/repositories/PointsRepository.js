/**
 * Points Repository Interface
 * Defines methods for interacting with points-related data
 */
class PointsRepository {
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
    throw new Error('Method not implemented');
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
    throw new Error('Method not implemented');
  }

  /**
   * Get user's points balance
   * @param {string} userId - User ID
   * @returns {Promise<number>} Points balance
   */
  async getBalance(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get user's transaction history
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Transactions and pagination info
   */
  async getTransactionHistory(userId, options) {
    throw new Error('Method not implemented');
  }
}

export default PointsRepository; 