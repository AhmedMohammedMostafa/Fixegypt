import { ApiError } from '../middlewares/errorHandler.js';
import MongoProductRepository from '../../persistence/repositories/MongoProductRepository.js';
import MongoRedemptionRepository from '../../persistence/repositories/MongoRedemptionRepository.js';
import MongoPointsRepository from '../../persistence/repositories/MongoPointsRepository.js';
import MongoUserRepository from '../../persistence/repositories/MongoUserRepository.js';
import CreateProductUseCase from '../../../application/use-cases/product/CreateProductUseCase.js';
import RedeemProductUseCase from '../../../application/use-cases/product/RedeemProductUseCase.js';
import { getUploadedFilePaths } from '../middlewares/uploadMiddleware.js';

// Initialize repositories
const productRepository = new MongoProductRepository();
const redemptionRepository = new MongoRedemptionRepository();
const pointsRepository = new MongoPointsRepository();
const userRepository = new MongoUserRepository();

// Initialize use cases
const createProductUseCase = new CreateProductUseCase(productRepository);
const redeemProductUseCase = new RedeemProductUseCase(
  pointsRepository,
  productRepository,
  redemptionRepository,
  userRepository
);

/**
 * Controller for product-related operations
 */
class ProductController {
  /**
   * Create a new product (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async createProduct(req, res, next) {
    try {
      const { name, description, pointsCost, category, stock } = req.body;
      
      // Get image path if uploaded
      const imagePaths = getUploadedFilePaths(req);
      const imagePath = imagePaths.length > 0 ? imagePaths[0] : null;
      
      // Create product
      const product = await createProductUseCase.execute({
        name,
        description,
        pointsCost: parseInt(pointsCost, 10),
        category,
        image: imagePath,
        stock: stock !== undefined ? parseInt(stock, 10) : null
      });
      
      // Return result
      res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: {
          product
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a product (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async updateProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const { name, description, pointsCost, category, isActive, stock } = req.body;
      
      // Get image path if uploaded
      const imagePaths = getUploadedFilePaths(req);
      const imagePath = imagePaths.length > 0 ? imagePaths[0] : null;
      
      // Prepare update data
      const updateData = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (pointsCost !== undefined) updateData.pointsCost = parseInt(pointsCost, 10);
      if (category !== undefined) updateData.category = category;
      if (isActive !== undefined) updateData.isActive = isActive === 'true';
      if (stock !== undefined) {
        updateData.stock = stock === 'null' ? null : parseInt(stock, 10);
      }
      if (imagePath) updateData.image = imagePath;
      
      // Update product
      const product = await productRepository.update(productId, updateData);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Product updated successfully',
        data: {
          product
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a product (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async deleteProduct(req, res, next) {
    try {
      const { productId } = req.params;
      
      // Delete product
      await productRepository.delete(productId);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all products with filtering and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getProducts(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        minCost, 
        maxCost, 
        isActive = 'true',
        search
      } = req.query;
      
      // Build filter
      const filter = {};
      
      if (category) filter.category = category;
      if (minCost) filter.minCost = parseInt(minCost, 10);
      if (maxCost) filter.maxCost = parseInt(maxCost, 10);
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (search) filter.search = search;
      
      // Get products
      const result = await productRepository.findAll(
        filter,
        {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10)
        }
      );
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Products retrieved successfully',
        data: {
          products: result.products,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getProductById(req, res, next) {
    try {
      const { productId } = req.params;
      
      // Get product
      const product = await productRepository.findById(productId);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Product retrieved successfully',
        data: {
          product
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Redeem a product with points
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async redeemProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const userId = req.user.id;
      
      // Redeem product
      const result = await redeemProductUseCase.execute(userId, productId);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Product redeemed successfully',
        data: {
          redemption: result.redemption,
          pointsDeducted: result.pointsDeducted,
          remainingPoints: result.remainingPoints
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController(); 