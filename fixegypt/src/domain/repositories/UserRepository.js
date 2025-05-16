/**
 * User Repository Interface
 * This is a port in the hexagonal architecture
 * It defines the contract for user data operations
 */
class UserRepository {
  /**
   * Create a new user
   * @param {User} user - User entity
   * @returns {Promise<User>} Created user
   */
  async create(user) {
    throw new Error('Method not implemented');
  }

  /**
   * Find a user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>} Found user or null
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} Found user or null
   */
  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Find a user by National ID
   * @param {string} nationalId - National ID
   * @returns {Promise<User|null>} Found user or null
   */
  async findByNationalId(nationalId) {
    throw new Error('Method not implemented');
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<User>} Updated user
   */
  async update(id, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * List users with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<{users: User[], total: number, page: number, limit: number}>} Paginated users
   */
  async findAll(options = { page: 1, limit: 10, filter: {} }) {
    throw new Error('Method not implemented');
  }

  /**
   * Verify a user
   * @param {string} id - User ID
   * @returns {Promise<User>} Verified user
   */
  async verifyUser(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Change user role
   * @param {string} id - User ID
   * @param {string} role - New role
   * @returns {Promise<User>} Updated user
   */
  async changeRole(id, role) {
    throw new Error('Method not implemented');
  }
}

export default UserRepository; 