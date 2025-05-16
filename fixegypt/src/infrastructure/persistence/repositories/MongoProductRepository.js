import ProductRepository from '../../../domain/repositories/ProductRepository.js';
import ProductModel from '../models/ProductModel.js';
import Product from '../../../domain/entities/Product.js';

/**
 * MongoDB implementation of ProductRepository
 */
class MongoProductRepository extends ProductRepository {
  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async create(productData) {
    const product = await ProductModel.create(productData);
    return product;
  }

  /**
   * Update an existing product
   * @param {string} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product
   */
  async update(productId, updateData) {
    const product = await ProductModel.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  }

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(productId) {
    const result = await ProductModel.findByIdAndDelete(productId);
    
    if (!result) {
      throw new Error('Product not found');
    }
    
    return true;
  }

  /**
   * Find product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product
   */
  async findById(productId) {
    const product = await ProductModel.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  }

  /**
   * Find all products with filtering and pagination
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} Products and pagination info
   */
  async findAll(filter = {}, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const sort = options.sort || { createdAt: -1 };
    
    // Build query filter
    const queryFilter = {};
    
    if (filter.category) {
      queryFilter.category = filter.category;
    }
    
    if (filter.minCost) {
      queryFilter.pointsCost = { $gte: filter.minCost };
    }
    
    if (filter.maxCost) {
      queryFilter.pointsCost = {
        ...queryFilter.pointsCost || {},
        $lte: filter.maxCost
      };
    }
    
    if (filter.isActive !== undefined) {
      queryFilter.isActive = filter.isActive;
    }
    
    if (filter.search) {
      const searchRegex = new RegExp(filter.search, 'i');
      queryFilter.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Execute query with pagination
    const products = await ProductModel.find(queryFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await ProductModel.countDocuments(queryFilter);
    
    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Check if product is available
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Availability status
   */
  async isAvailable(productId) {
    const product = await ProductModel.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (!product.isActive) {
      return false;
    }
    
    if (product.stock === null) {
      return true; // Unlimited stock
    }
    
    return product.stock > 0;
  }

  /**
   * Reduce product stock by one
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated product
   */
  async reduceStock(productId) {
    const product = await ProductModel.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (!product.isActive) {
      throw new Error('Product is not active');
    }
    
    if (product.stock !== null && product.stock <= 0) {
      throw new Error('Product out of stock');
    }
    
    if (product.stock === null) {
      // Unlimited stock, no need to reduce
      return product;
    }
    
    // Reduce stock and set isActive to false if out of stock
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      {
        $inc: { stock: -1 },
        $set: { isActive: product.stock > 1 } // Set to false if this is the last item
      },
      { new: true }
    );
    
    return updatedProduct;
  }
}

export default MongoProductRepository; 