/**
 * Report Repository Interface
 * This is a port in the hexagonal architecture
 * It defines the contract for report data operations
 */
class ReportRepository {
  /**
   * Create a new report
   * @param {Report} report - Report entity
   * @returns {Promise<Report>} Created report
   */
  async create(report) {
    throw new Error('Method not implemented');
  }

  /**
   * Find a report by ID
   * @param {string} id - Report ID
   * @returns {Promise<Report|null>} Found report or null
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Update a report
   * @param {string} id - Report ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Report>} Updated report
   */
  async update(id, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete a report
   * @param {string} id - Report ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * List reports with pagination and filtering
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<{reports: Report[], total: number, page: number, limit: number}>} Paginated reports
   */
  async findAll(options = { page: 1, limit: 10, filter: {} }) {
    throw new Error('Method not implemented');
  }

  /**
   * Find reports by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<{reports: Report[], total: number, page: number, limit: number}>} User's reports
   */
  async findByUserId(userId, options = { page: 1, limit: 10 }) {
    throw new Error('Method not implemented');
  }

  /**
   * Update report status
   * @param {string} id - Report ID
   * @param {string} status - New status
   * @param {string} adminId - Admin ID
   * @param {string} note - Optional note
   * @returns {Promise<Report>} Updated report
   */
  async updateStatus(id, status, adminId, note = '') {
    throw new Error('Method not implemented');
  }

  /**
   * Add images to a report
   * @param {string} id - Report ID
   * @param {Array<string>} imageUrls - Image URLs to add
   * @returns {Promise<Report>} Updated report
   */
  async addImages(id, imageUrls) {
    throw new Error('Method not implemented');
  }

  /**
   * Get reports by location
   * @param {Object} coordinates - Location coordinates
   * @param {number} radius - Search radius in kilometers
   * @param {Object} options - Pagination options
   * @returns {Promise<{reports: Report[], total: number}>} Found reports
   */
  async findByLocation(coordinates, radius, options = { page: 1, limit: 10 }) {
    throw new Error('Method not implemented');
  }

  /**
   * Get reports statistics
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Report statistics
   */
  async getStatistics(filter = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get report counts by status
   * @returns {Promise<Object>} Counts by status
   */
  async getCountsByStatus() {
    throw new Error('Method not implemented');
  }

  /**
   * Get report counts by category
   * @returns {Promise<Object>} Counts by category
   */
  async getCountsByCategory() {
    throw new Error('Method not implemented');
  }

  /**
   * Get report counts by governorate
   * @returns {Promise<Object>} Counts by governorate
   */
  async getCountsByGovernorate() {
    throw new Error('Method not implemented');
  }
}

export default ReportRepository; 