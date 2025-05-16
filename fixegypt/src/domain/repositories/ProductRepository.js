/**
 * Product Repository Interface
 * Defines methods for interacting with product-related data
 */
class ProductRepository {
  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async create(productData) {
    throw new Error('Method not implemented');
  }

  /**
   * Update an existing product
   * @param {string} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product
   */
  async update(productId, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product
   */
  async findById(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all products with filtering and pagination
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} Products and pagination info
   */
  async findAll(filter, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if product is available
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Availability status
   */
  async isAvailable(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Reduce product stock by one
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated product
   */
  async reduceStock(productId) {
    throw new Error('Method not implemented');
  }
}

export default ProductRepository; 