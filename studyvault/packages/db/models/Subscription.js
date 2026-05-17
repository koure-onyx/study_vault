import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: String, enum: ['free', 'basic', 'premium', 'family'], required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' },
  
  // Payment details
  provider: { type: String, enum: ['stripe', 'paypal', 'jazzcash', 'easypaisa'], default: 'stripe' },
  payment_id: String,
  subscription_id: String,
  
  // Billing cycle
  billing_cycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  amount: Number,
  currency: { type: String, default: 'PKR' },
  
  // Dates
  start_date: { type: Date, default: Date.now },
  current_period_start: Date,
  current_period_end: Date,
  cancelled_at: Date,
  ended_at: Date,
  
  // Features
  features: {
    ai_credits_per_day: { type: Number, default: 5 },
    download_limit_per_month: { type: Number, default: 10 },
    video_lessons_access: { type: Boolean, default: false },
    priority_support: { type: Boolean, default: false },
    offline_mode: { type: Boolean, default: false },
  },
  
  // Auto-renewal
  auto_renew: { type: Boolean, default: true },
  renewal_reminder_sent: { type: Boolean, default: false },
}, { timestamps: true });

SubscriptionSchema.index({ user_id: 1, status: 1 });
SubscriptionSchema.index({ status: 1, current_period_end: 1 });

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
