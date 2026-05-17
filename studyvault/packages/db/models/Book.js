const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
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
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true,
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
  },
  grade: {
    type: Number,
    required: true,
    min: 1,
    max: 16,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  subjectSlug: {
    type: String,
    required: true,
    lowercase: true,
  },
  edition: {
    type: String,
    trim: true,
  },
  publishYear: {
    type: Number,
  },
  coverImage: {
    type: String,
  },
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
  }],
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected'],
    default: 'draft',
  },
  ingestedFrom: {
    type: String,
  },
  version: {
    type: String,
    default: '1.0.0',
  },
}, {
  timestamps: true,
});

bookSchema.index({ slug: 1 });
bookSchema.index({ program: 1, board: 1, grade: 1, subject: 1 });
bookSchema.index({ status: 1 });

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
