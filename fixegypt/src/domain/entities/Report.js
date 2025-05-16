/**
 * Report Entity in the domain layer
 * This represents a citizen's city report
 */
class Report {
  constructor({
    id = null,
    title,
    description,
    category,
    location = {
      address: '',
      city: '',
      governorate: '',
      coordinates: { lat: 0, lng: 0 }
    },
    images = [],
    status = 'pending', // pending, in-progress, resolved, rejected
    urgency = 'medium', // low, medium, high, critical
    userId = null,  // Allow null userId for more robustness
    adminId = null,
    aiAnalysis = {
      classification: null,
      urgency: null,
      confidence: null
    },
    statusHistory = [],
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    // Ensure required fields have fallback values
    this.id = id;
    this.title = title || 'Untitled Report';
    this.description = description || 'No description provided';
    this.category = category || 'other';
    
    // Ensure location has a valid structure
    this.location = {
      address: location?.address || '',
      city: location?.city || '',
      governorate: location?.governorate || '',
      coordinates: {
        lat: parseFloat(location?.coordinates?.lat || 0),
        lng: parseFloat(location?.coordinates?.lng || 0)
      }
    };
    
    // Ensure images is an array of valid objects
    this.images = Array.isArray(images) ? images : [];
    
    // Validate status and urgency fields
    this.status = ['pending', 'in-progress', 'resolved', 'rejected'].includes(status) ? status : 'pending';
    this.urgency = ['low', 'medium', 'high', 'critical'].includes(urgency) ? urgency : 'medium';
    
    this.userId = userId;
    this.adminId = adminId;
    this.aiAnalysis = aiAnalysis || {};
    this.statusHistory = statusHistory.length > 0 
      ? statusHistory 
      : [{ status: this.status, timestamp: new Date(), note: 'Report created' }];
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt || Date.now());
    this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt || Date.now());
  }

  /**
   * Update the status of the report
   * @param {string} newStatus - New status value
   * @param {string} adminId - ID of the admin making the update
   * @param {string} note - Optional note about the status change
   */
  updateStatus(newStatus, adminId, note = '') {
    if (!['pending', 'in-progress', 'resolved', 'rejected'].includes(newStatus)) {
      throw new Error('Invalid status value');
    }

    this.status = newStatus;
    this.adminId = adminId;
    this.updatedAt = new Date();
    
    // Add to status history
    this.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      adminId,
      note
    });
  }

  /**
   * Update the urgency of the report
   * @param {string} newUrgency - New urgency value
   * @param {string} updatedBy - ID of the user/admin making the update
   */
  updateUrgency(newUrgency, updatedBy) {
    if (!['low', 'medium', 'high', 'critical'].includes(newUrgency)) {
      throw new Error('Invalid urgency value');
    }

    this.urgency = newUrgency;
    this.updatedAt = new Date();
    
    // Add to status history with note about urgency change
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      adminId: updatedBy,
      note: `Urgency updated to ${newUrgency}`
    });
  }

  /**
   * Set AI analysis results
   * @param {object} analysis - AI analysis results
   */
  setAiAnalysis(analysis) {
    this.aiAnalysis = {
      ...this.aiAnalysis,
      ...analysis
    };
    this.updatedAt = new Date();
  }

  /**
   * Get a summary of the report
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      status: this.status,
      urgency: this.urgency,
      location: {
        city: this.location.city,
        governorate: this.location.governorate
      },
      createdAt: this.createdAt
    };
  }

  /**
   * Check if the report is resolved
   */
  isResolved() {
    return this.status === 'resolved';
  }

  /**
   * Get days since report creation
   */
  getDaysSinceCreation() {
    const diffTime = Math.abs(new Date() - new Date(this.createdAt));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export default Report; 