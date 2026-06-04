import mongoose from 'mongoose';

const BoardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  short_code: { type: String, required: true, uppercase: true },
  city: String,
  province: String,
  country: { type: String, default: 'Pakistan' },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

BoardSchema.index({ short_code: 1 });

export default mongoose.models.Board || mongoose.model('Board', BoardSchema);
