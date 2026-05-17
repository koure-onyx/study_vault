const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  grades: [{
    type: Number,
    min: 1,
    max: 16,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  boards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
  }],
}, {
  timestamps: true,
});

// Index for fast lookups
programSchema.index({ slug: 1 });
programSchema.index({ isActive: 1 });

module.exports = mongoose.models.Program || mongoose.model('Program', programSchema);
