/**
 * Redemption Entity in the domain layer
 * This represents a product redemption request
 */
class Redemption {
  constructor({
    id = null,
    userId,
    productId,
    pointsCost,
    status = 'pending', // pending, processing, completed, rejected
    notes = '',
    adminId = null,
    processingDate = null,
    completionDate = null,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.userId = userId;
    this.productId = productId;
    this.pointsCost = pointsCost;
    this.status = status;
    this.notes = notes;
    this.adminId = adminId;
    this.processingDate = processingDate;
    this.completionDate = completionDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Update the status of the redemption
   * @param {string} newStatus - New status value
   * @param {string} adminId - ID of the admin making the update
   * @param {string} notes - Optional notes about the status change
   */
  updateStatus(newStatus, adminId, notes = '') {
    if (!['pending', 'processing', 'completed', 'rejected'].includes(newStatus)) {
      throw new Error('Invalid status value');
    }

    this.status = newStatus;
    this.adminId = adminId;
    this.notes = notes || this.notes;
    this.updatedAt = new Date();
    
    // Update status-specific dates
    if (newStatus === 'processing' && !this.processingDate) {
      this.processingDate = new Date();
    } else if (newStatus === 'completed' && !this.completionDate) {
      this.completionDate = new Date();
    }
  }

  /**
   * Check if redemption is completed
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Check if redemption is rejected
   */
  isRejected() {
    return this.status === 'rejected';
  }

  /**
   * Check if redemption is pending
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Check if redemption is processing
   */
  isProcessing() {
    return this.status === 'processing';
  }
}

export default Redemption; 