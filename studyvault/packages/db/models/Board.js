const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
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
  fullName: {
    type: String,
    trim: true,
  },
  region: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

boardSchema.index({ slug: 1 });
boardSchema.index({ isActive: 1 });

module.exports = mongoose.models.Board || mongoose.model('Board', boardSchema);
