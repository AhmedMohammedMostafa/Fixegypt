/**
 * Product Entity in the domain layer
 * This represents a product that can be redeemed with points
 */
class Product {
  constructor({
    id = null,
    name,
    description,
    pointsCost,
    category,
    image = null,
    isActive = true,
    stock = null, // null means unlimited
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.pointsCost = pointsCost;
    this.category = category;
    this.image = image;
    this.isActive = isActive;
    this.stock = stock;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Check if product is available
   */
  isAvailable() {
    if (!this.isActive) {
      return false;
    }
    
    if (this.stock === null) {
      return true; // Unlimited stock
    }
    
    return this.stock > 0;
  }

  /**
   * Reduce product stock by one
   */
  reduceStock() {
    if (this.stock === null) {
      return; // Unlimited stock
    }
    
    if (this.stock <= 0) {
      throw new Error('Product out of stock');
    }
    
    this.stock -= 1;
    this.updatedAt = new Date();
    
    // Automatically deactivate if out of stock
    if (this.stock === 0) {
      this.isActive = false;
    }
  }

  /**
   * Get product summary
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      pointsCost: this.pointsCost,
      category: this.category,
      isAvailable: this.isAvailable()
    };
  }
}

export default Product; 