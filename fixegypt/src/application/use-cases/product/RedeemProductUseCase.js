/**
 * Use case for redeeming a product with points
 */
class RedeemProductUseCase {
  constructor(pointsRepository, productRepository, redemptionRepository, userRepository) {
    this.pointsRepository = pointsRepository;
    this.productRepository = productRepository;
    this.redemptionRepository = redemptionRepository;
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Redemption result
   */
  async execute(userId, productId) {
    // Find user
    const user = await this.userRepository.findById(userId);
    
    // Find product
    const product = await this.productRepository.findById(productId);
    
    // Check if product is available
    if (!await this.productRepository.isAvailable(productId)) {
      throw new Error('Product is not available for redemption');
    }
    
    // Check if user has enough points
    if (user.points < product.pointsCost) {
      throw new Error(`Insufficient points. Required: ${product.pointsCost}, Available: ${user.points}`);
    }
    
    // Create redemption request
    const redemption = await this.redemptionRepository.create({
      userId,
      productId,
      pointsCost: product.pointsCost,
      status: 'pending'
    });
    
    // Deduct points from user
    await this.pointsRepository.deductPoints(
      userId, 
      product.pointsCost, 
      productId,
      `Points redeemed for product: ${product.name}`
    );
    
    // Update product stock
    await this.productRepository.reduceStock(productId);
    
    return {
      redemption,
      pointsDeducted: product.pointsCost,
      remainingPoints: user.points - product.pointsCost
    };
  }
}

export default RedeemProductUseCase; 