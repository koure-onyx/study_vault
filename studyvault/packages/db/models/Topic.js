const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  topicNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
  },
  content: [{
    type: {
      type: String,
      enum: ['heading', 'paragraph', 'definition', 'example', 'formula', 'diagram', 'note', 'warning'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  }],
  summary: {
    type: String,
    trim: true,
  },
  keyPoints: [{
    type: String,
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  estimatedTimeMinutes: {
    type: Number,
    default: 15,
  },
  seoTitle: {
    type: String,
    trim: true,
  },
  seoDescription: {
    type: String,
    trim: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

topicSchema.index({ chapter: 1, topicNumber: 1 });
topicSchema.index({ chapter: 1, slug: 1 });
topicSchema.index({ book: 1, isPublished: 1 });
topicSchema.index({ slug: 1 });

module.exports = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
