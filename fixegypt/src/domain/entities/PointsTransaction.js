/**
 * PointsTransaction Entity in the domain layer
 * This represents a transaction in the points system
 */
class PointsTransaction {
  constructor({
    id = null,
    userId,
    amount,
    type, // 'earn', 'redeem'
    source, // 'report_submission', 'report_resolved', 'product_redemption'
    referenceId = null, // ID of report or product
    description = '',
    balance = 0, // Points balance after transaction
    createdAt = new Date()
  }) {
    this.id = id;
    this.userId = userId;
    this.amount = amount;
    this.type = type;
    this.source = source;
    this.referenceId = referenceId;
    this.description = description;
    this.balance = balance;
    this.createdAt = createdAt;
  }

  /**
   * Check if transaction is for earning points
   */
  isEarning() {
    return this.type === 'earn';
  }

  /**
   * Check if transaction is for redeeming points
   */
  isRedemption() {
    return this.type === 'redeem';
  }

  /**
   * Create an earning transaction
   * @param {string} userId - User ID
   * @param {number} amount - Points amount
   * @param {string} source - Source of points
   * @param {string} referenceId - ID of reference object
   * @param {string} description - Transaction description
   * @param {number} balance - New points balance
   * @returns {PointsTransaction} New transaction
   */
  static createEarningTransaction(userId, amount, source, referenceId, description, balance) {
    return new PointsTransaction({
      userId,
      amount,
      type: 'earn',
      source,
      referenceId,
      description,
      balance
    });
  }

  /**
   * Create a redemption transaction
   * @param {string} userId - User ID
   * @param {number} amount - Points amount
   * @param {string} referenceId - ID of product
   * @param {string} description - Transaction description
   * @param {number} balance - New points balance
   * @returns {PointsTransaction} New transaction
   */
  static createRedemptionTransaction(userId, amount, referenceId, description, balance) {
    return new PointsTransaction({
      userId,
      amount,
      type: 'redeem',
      source: 'product_redemption',
      referenceId,
      description,
      balance
    });
  }
}

export default PointsTransaction; 