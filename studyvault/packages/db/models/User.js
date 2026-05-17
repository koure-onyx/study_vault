import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: String,
  avatar_url: String,

  role: {
    type: String,
    enum: ['student', 'parent', 'teacher', 'admin', 'superadmin'],
    default: 'student',
  },

  // Google OAuth
  google_id: String,
  google_email: String,

  // Auth state
  is_verified: { type: Boolean, default: false },
  otp: String,
  otp_expires_at: Date,
  password_reset_token: String,
  password_reset_expires: Date,

  // Student-specific fields
  student_profile: {
    program_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }],
    board_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    active_program_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    xp_total: { type: Number, default: 0 },
    streak_days: { type: Number, default: 0 },
    last_active: Date,
  },

  // Parent-specific: links to child student accounts
  linked_children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Subscription
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium', 'family'], default: 'free' },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    expires_at: Date,
    ai_credits_used_today: { type: Number, default: 0 },
    ai_credits_reset_at: Date,
  },

  // Session guard — anti-account-sharing
  active_session_token: String,
  active_device_fingerprint: String,

  // Teacher-specific
  teacher_profile: {
    assigned_book_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    assigned_program_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }],
  },
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ google_id: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscription.plan': 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
