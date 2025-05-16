/**
 * Use case for creating a new product
 */
class CreateProductUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the use case
   * @param {Object} productData - Product data
   * @param {string} productData.name - Product name
   * @param {string} productData.description - Product description
   * @param {number} productData.pointsCost - Points cost
   * @param {string} productData.category - Product category
   * @param {string} productData.image - Product image URL (optional)
   * @param {number} productData.stock - Product stock (optional, null for unlimited)
   * @returns {Promise<Object>} Created product
   */
  async execute(productData) {
    // Validate product data
    this._validateProductData(productData);
    
    // Create product
    const product = await this.productRepository.create({
      name: productData.name,
      description: productData.description,
      pointsCost: productData.pointsCost,
      category: productData.category,
      image: productData.image || null,
      stock: productData.stock !== undefined ? productData.stock : null,
      isActive: true
    });
    
    return product;
  }

  /**
   * Validate product data
   * @param {Object} productData - Product data
   * @private
   */
  _validateProductData(productData) {
    const { name, description, pointsCost, category } = productData;
    
    if (!name || typeof name !== 'string' || name.length < 2) {
      throw new Error('Product name is required and must be at least 2 characters');
    }
    
    if (!description || typeof description !== 'string' || description.length < 10) {
      throw new Error('Product description is required and must be at least 10 characters');
    }
    
    if (!pointsCost || typeof pointsCost !== 'number' || pointsCost < 1) {
      throw new Error('Product points cost is required and must be a positive number');
    }
    
    if (!category || typeof category !== 'string') {
      throw new Error('Product category is required');
    }
    
    const validCategories = ['gift_card', 'merchandise', 'voucher', 'donation', 'service', 'other'];
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid product category. Valid categories are: ${validCategories.join(', ')}`);
    }
    
    if (productData.stock !== undefined && productData.stock !== null && 
        (typeof productData.stock !== 'number' || productData.stock < 0)) {
      throw new Error('Product stock must be a non-negative number or null for unlimited');
    }
  }
}

export default CreateProductUseCase; 