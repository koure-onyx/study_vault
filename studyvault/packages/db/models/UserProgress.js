const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  lastViewedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  quizScores: [{
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
    },
    correctAnswers: {
      type: Number,
    },
    takenAt: {
      type: Date,
      default: Date.now,
    },
  }],
  notes: [{
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  bookmarks: [{
    contentId: {
      type: String,
    },
    contentSnippet: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

userProgressSchema.index({ user: 1, topic: 1 });
userProgressSchema.index({ user: 1, status: 1 });
userProgressSchema.index({ user: 1, lastViewedAt: -1 });

module.exports = mongoose.models.UserProgress || mongoose.model('UserProgress', userProgressSchema);
