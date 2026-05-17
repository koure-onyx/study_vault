const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
  },
  grade: {
    type: Number,
    min: 1,
    max: 16,
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
  },
  avatar: {
    type: String,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  lastActiveAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ grade: 1, board: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
