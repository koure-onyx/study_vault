const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  chapterNumber: {
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
  description: {
    type: String,
    trim: true,
  },
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  }],
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

chapterSchema.index({ book: 1, chapterNumber: 1 });
chapterSchema.index({ book: 1, slug: 1 });

module.exports = mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema);
