import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 14,
    maxlength: 14
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^01[0-2|5]{1}[0-9]{8}$/, 'Please provide a valid Egyptian phone number']
  },
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
  role: {
    type: String,
    enum: ['citizen', 'admin'],
    default: 'citizen'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  refreshTokens: [{
    token: String,
    expiresAt: Date
  }],
  verificationToken: {
    token: String,
    expiresAt: Date
  },
  resetPasswordToken: {
    token: String,
    expiresAt: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      return ret;
    }
  }
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ nationalId: 1 });

const UserModel = mongoose.model('User', userSchema);

export default UserModel; 