import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  pointsCost: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    required: true,
    enum: ['gift_card', 'merchandise', 'voucher', 'donation', 'service', 'other']
  },
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: null // null means unlimited
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
productSchema.index({ category: 1 });
productSchema.index({ pointsCost: 1 });
productSchema.index({ isActive: 1 });

const ProductModel = mongoose.model('Product', productSchema);

export default ProductModel; 