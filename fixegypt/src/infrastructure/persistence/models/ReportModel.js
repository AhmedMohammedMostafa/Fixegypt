import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'road_damage', 
      'water_issue', 
      'electricity_issue', 
      'waste_management', 
      'public_property_damage', 
      'street_lighting', 
      'sewage_problem',
      'public_transportation', 
      'environmental_issue', 
      'other'
    ]
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    governorate: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      type: {
        lat: Number,
        lng: Number
      },
      required: true,
      index: '2dsphere'
    }
  },
  images: [
    {
      url: {
        type: String,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  aiAnalysis: {
    classification: String,
    urgency: String,
    confidence: Number,
    analysisTimestamp: Date
  },
  statusHistory: [
    {
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'rejected'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      note: String
    }
  ]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for faster queries
reportSchema.index({ userId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ 'location.governorate': 1 });
reportSchema.index({ 'location.city': 1 });
reportSchema.index({ 'location.coordinates': '2dsphere' });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ urgency: 1 });

// Pre-save hook to ensure userId and adminId are stored correctly
reportSchema.pre('save', function(next) {
  // Convert userId to ObjectId if it's an object with _id/id
  if (this.userId && typeof this.userId === 'object' && !mongoose.Types.ObjectId.isValid(this.userId)) {
    this.userId = this.userId._id || this.userId.id;
  }
  
  // Convert adminId to ObjectId if it's an object with _id/id
  if (this.adminId && typeof this.adminId === 'object' && !mongoose.Types.ObjectId.isValid(this.adminId)) {
    this.adminId = this.adminId._id || this.adminId.id;
  }
  
  // Process statusHistory entries to ensure adminId is stored correctly
  if (this.statusHistory && Array.isArray(this.statusHistory)) {
    this.statusHistory.forEach(entry => {
      if (entry.adminId && typeof entry.adminId === 'object' && !mongoose.Types.ObjectId.isValid(entry.adminId)) {
        entry.adminId = entry.adminId._id || entry.adminId.id;
      }
    });
  }
  
  next();
});

const ReportModel = mongoose.model('Report', reportSchema);

export default ReportModel; 