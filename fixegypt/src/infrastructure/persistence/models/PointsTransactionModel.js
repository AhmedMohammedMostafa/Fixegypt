import mongoose from 'mongoose';

const pointsTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'redeem'],
    required: true
  },
  source: {
    type: String,
    enum: ['report_submission', 'report_resolved', 'product_redemption', 'admin_adjustment', 'other'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel',
    default: null
  },
  referenceModel: {
    type: String,
    enum: ['Report', 'Product', null],
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  balance: {
    type: Number,
    required: true,
    min: 0
  }
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

// Index for faster queries
pointsTransactionSchema.index({ userId: 1 });
pointsTransactionSchema.index({ type: 1 });
pointsTransactionSchema.index({ createdAt: -1 });

const PointsTransactionModel = mongoose.model('PointsTransaction', pointsTransactionSchema);

export default PointsTransactionModel; 