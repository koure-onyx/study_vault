const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'premium_yearly'],
    default: 'free',
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trial'],
    default: 'active',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  trialEndsAt: {
    type: Date,
  },
  cancelledAt: {
    type: Date,
  },
  cancelReason: {
    type: String,
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'paypal', 'jazzcash', 'easypaisa', 'manual'],
  },
  paymentId: {
    type: String,
  },
  features: [{
    type: String,
  }],
  autoRenew: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
