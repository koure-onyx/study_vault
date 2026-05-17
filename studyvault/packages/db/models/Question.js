const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer', 'long_answer', 'fill_blank', 'matching'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  question: {
    type: String,
    required: true,
  },
  options: [{
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  }],
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
  },
  hints: [{
    type: String,
  }],
  tags: [{
    type: String,
  }],
  bloomTaxonomyLevel: {
    type: String,
    enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
    default: 'understand',
  },
  source: {
    type: String,
    enum: ['ai_generated', 'teacher_added', 'imported'],
    default: 'ai_generated',
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  correctAttempts: {
    type: Number,
    default: 0,
  },
  incorrectAttempts: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

questionSchema.index({ topic: 1, difficulty: 1 });
questionSchema.index({ topic: 1, type: 1 });
questionSchema.index({ book: 1, isActive: 1 });

module.exports = mongoose.models.Question || mongoose.model('Question', questionSchema);
