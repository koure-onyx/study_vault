const mongoose = require('mongoose');

const userVaultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  },
  itemType: {
    type: String,
    enum: ['note', 'bookmark', 'flashcard', 'summary', 'formula', 'important_question'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: [{
    type: String,
  }],
  color: {
    type: String,
    default: '#FFFFFF',
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    default: true,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  lastReviewedAt: {
    type: Date,
  },
  nextReviewAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

userVaultSchema.index({ user: 1, itemType: 1 });
userVaultSchema.index({ user: 1, isPinned: 1 });
userVaultSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.UserVault || mongoose.model('UserVault', userVaultSchema);
