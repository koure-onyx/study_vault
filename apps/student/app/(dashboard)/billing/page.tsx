'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';

// ============================================================================
// SPRING PRESETS (from syntax-enforcer.md)
// ============================================================================
const softCardSpring = { stiffness: 100, damping: 15, mass: 1.0 };
const toastSpring = { stiffness: 300, damping: 25, mass: 0.8 };

// ============================================================================
// PLAN DATA
// ============================================================================
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'PKR',
    features: ['5 AI credits/day', 'Basic progress tracking', 'Limited vault storage'],
    popular: false,
    color: 'hsl(0, 0%, 60%)',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 499,
    currency: 'PKR',
    period: 'month',
    features: ['50 AI credits/day', 'Full progress analytics', 'Unlimited vault', 'Email support'],
    popular: true,
    color: 'hsl(270, 90%, 60%)',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 999,
    currency: 'PKR',
    period: 'month',
    features: ['Unlimited AI credits', 'Advanced analytics', 'Priority support', 'Family sharing (up to 4)', 'Early access features'],
    popular: false,
    color: 'hsl(45, 100%, 50%)',
  },
];

// ============================================================================
// SECURE LOCK OVERLAY COMPONENT
// ============================================================================
interface SecureLockOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  onConfirm: () => void;
}

const SecureLockOverlay: React.FC<SecureLockOverlayProps> = ({ isOpen, onClose, planName, onConfirm }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) {
      controls.start({
        rotate: 360,
        transition: { duration: 3, repeat: Infinity, ease: 'linear' },
      });
    } else {
      controls.stop();
    }
  }, [isOpen, controls]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={softCardSpring}
            className="fixed inset-0 m-auto w-full max-w-md h-fit z-50 p-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
                <motion.svg
                  animate={controls}
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  className="mx-auto mb-4"
                >
                  {/* Lock Body */}
                  <rect x="16" y="28" width="32" height="24" rx="4" fill="currentColor" className="text-purple-600 dark:text-purple-400" />
                  {/* Lock Shackle */}
                  <path
                    d="M20 28V20C20 13.373 25.373 8 32 8C38.627 8 44 13.373 44 20V28"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    className="text-purple-600 dark:text-purple-400"
                  />
                  {/* Keyhole */}
                  <circle cx="32" cy="38" r="4" fill="white" />
                  <rect x="30" y="42" width="4" height="6" rx="2" fill="white" />
                </motion.svg>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Secure Payment
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You are about to subscribe to <span className="font-semibold">{planName}</span>
                </p>
              </div>

              {/* Security Info */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-green-500">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.5 11.5l-5 5L3 13l1.5-1.5 2 2 3.5-3.5L8.5 8.5 8 9l-1-1 2-2 2.5 2.5z" />
                  </svg>
                  <span>256-bit SSL Encrypted</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-blue-500">
                    <path d="M14 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1zM2 1a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V3a2 2 0 00-2-2H2z" />
                    <path d="M8 4a1 1 0 011 1v2h2a1 1 0 110 2H9v2a1 1 0 11-2 0V9H5a1 1 0 110-2h2V5a1 1 0 011-1z" />
                  </svg>
                  <span>PCI DSS Compliant</span>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={softCardSpring}
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={softCardSpring}
                    onClick={onConfirm}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Proceed to Pay
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// PENDING BANNER COMPONENT
// ============================================================================
interface PendingBannerProps {
  transactionId?: string;
}

const PendingBanner: React.FC<PendingBannerProps> = ({ transactionId }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={toastSpring}
      className="relative overflow-hidden rounded-xl border border-yellow-400/30 bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-6"
    >
      {/* Animated Diagonal Stripes */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            #fbbf24 10px,
            #fbbf24 20px
          )`,
          backgroundSize: '200% 200%',
          animation: 'stripe-scroll 2s linear infinite',
        }}
      />

      <style jsx>{`
        @keyframes stripe-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
      `}</style>

      <div className="relative flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-yellow-600 dark:text-yellow-400"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </motion.div>

        <div className="flex-1">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
            Payment Processing
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {transactionId
              ? `Transaction ID: ${transactionId}`
              : 'Waiting for payment gateway confirmation...'}
          </p>
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-yellow-500"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// SUCCESS BANNER WITH PARTICLES
// ============================================================================
interface SuccessBannerProps {
  planName: string;
  expiresAt: string;
  onDismiss: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const SuccessBanner: React.FC<SuccessBannerProps> = ({ planName, expiresAt, onDismiss }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles on mount
    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 50, // Start from center (percentage)
      y: 50,
      vx: (Math.random() - 0.5) * 400, // Random velocity
      vy: (Math.random() - 0.5) * 400 - 200, // Upward bias
      color: ['#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'][
        Math.floor(Math.random() * 5)
      ],
    }));

    setParticles(newParticles);

    // Animate particles with gravity
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + (p.vx * 0.016) / 10, // Convert to percentage
          y: p.y + (p.vy * 0.016) / 10,
          vy: p.vy + 500 * 0.016, // Apply gravity (500 from mandate)
        })).filter((p) => p.y < 100) // Remove off-screen particles
      );
    }, 16);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={toastSpring}
      className="relative overflow-hidden rounded-xl border border-green-400/30 bg-green-50 dark:bg-green-900/20 p-6 mb-6"
    >
      {/* Particle Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: `${particle.x}%`, y: `${particle.y}%`, opacity: 1 }}
            animate={{
              x: `${particle.x}%`,
              y: `${particle.y}%`,
              opacity: Math.max(0, 1 - particle.y / 100),
            }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: particle.color,
            }}
          />
        ))}
      </div>

      <div className="relative flex items-start gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="text-green-600 dark:text-green-400"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 2a14 14 0 100 28 14 14 0 000-28zm-1.5 20.5l-6-6 2.12-2.12 3.88 3.88 9.88-9.88 2.12 2.12-12 12z" />
          </svg>
        </motion.div>

        <div className="flex-1">
          <h4 className="text-lg font-bold text-green-800 dark:text-green-200 mb-1">
            🎉 Payment Successful!
          </h4>
          <p className="text-green-700 dark:text-green-300 mb-2">
            Your <span className="font-semibold">{planName}</span> plan is now active.
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Valid until:{' '}
            <span className="font-mono">{new Date(expiresAt).toLocaleDateString('en-PK')}</span>
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// FAILED/MANUAL ENTRY BANNER
// ============================================================================
interface FailedBannerProps {
  onSubmitTransactionId: (id: string) => void;
  isLoading: boolean;
}

const FailedBanner: React.FC<FailedBannerProps> = ({ onSubmitTransactionId, isLoading }) => {
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const controls = useAnimation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate transaction ID format (EasyPaisa/JazzCash typical formats)
    const isValid = /^[A-Z0-9]{10,20}$/i.test(transactionId.trim());

    if (!isValid) {
      setError('Invalid transaction ID format');
      // Shake animation
      await controls.start({
        x: [-5, 5, -5, 5, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
      return;
    }

    onSubmitTransactionId(transactionId.trim());
  };

  return (
    <motion.div
      ref={controls as any}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={toastSpring}
      className="rounded-xl border border-red-400/30 bg-red-50 dark:bg-red-900/20 p-6 mb-6"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="text-red-600 dark:text-red-400">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 2a14 14 0 100 28 14 14 0 000-28zm0 24a1 1 0 110-2 1 1 0 010 2zm1-7.414V8a1 1 0 10-2 0v10.586l-2.293 2.293a1 1 0 001.414 1.414l3-3a1 1 0 00.293-.707z" />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="text-lg font-bold text-red-800 dark:text-red-200 mb-1">
            Payment Verification Required
          </h4>
          <p className="text-red-700 dark:text-red-300 text-sm">
            We couldn&apos;t automatically verify your payment. Please enter your transaction ID manually.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="transactionId" className="block text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Transaction ID
          </label>
          <input
            id="transactionId"
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g., EP1234567890"
            className="w-full px-4 py-3 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-red-950/30 text-red-900 dark:text-red-100 placeholder-red-400 dark:placeholder-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </motion.p>
          )}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          transition={softCardSpring}
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying...
            </>
          ) : (
            'Verify Transaction'
          )}
        </motion.button>
      </form>

      <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
        <p className="text-xs text-red-600 dark:text-red-400 text-center">
          Check your EasyPaisa or JazzCash SMS for the transaction ID
        </p>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN BILLING PAGE COMPONENT
// ============================================================================
export default function BillingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showLockOverlay, setShowLockOverlay] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    expiresAt: string;
    amount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current subscription status
  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      try {
        // Server extracts userId from session/token - no need to pass in query
        const res = await fetch('/api/checkout');
        const data = await res.json();
        if (data.success && data.subscription) {
          setSubscription(data.subscription);
          if (data.subscription.status === 'active') {
            setPaymentState('success');
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };

    fetchSubscription();
  }, [user]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePayNow = () => {
    if (!selectedPlan) return;
    setShowLockOverlay(true);
  };

  const handleConfirmPayment = async () => {
    setShowLockOverlay(false);
    setPaymentState('pending');

    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan || !user) return;

    try {
      setIsLoading(true);

      // Initialize checkout session - server extracts userId from auth
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: 'easypaisa',
        }),
      });

      const data = await res.json();

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        setTimeout(() => {
          pollPaymentStatus();
        }, 5000);
      } else {
        throw new Error(data.message || 'Checkout failed');
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
      setPaymentState('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = useCallback(async () => {
    const maxAttempts = 12;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentState('failed');
        return;
      }

      try {
        const res = await fetch(`/api/checkout?userId=${user?.id}`);
        const data = await res.json();

        if (data.success && data.subscription?.status === 'active') {
          setSubscription(data.subscription);
          setPaymentState('success');
          return;
        }

        attempts++;
        setTimeout(poll, 10000);
      } catch (error) {
        attempts++;
        setTimeout(poll, 10000);
      }
    };

    poll();
  }, [user]);

  const handleManualTransactionSubmit = async (id: string) => {
    if (!user) return;

    try {
      setIsLoading(true);

      const res = await fetch('/api/webhooks/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: id,
          user_id: user.id,
          manual_verification: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTimeout(pollPaymentStatus, 2000);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Manual verification failed:', error);
      setPaymentState('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissSuccess = () => {
    setPaymentState('idle');
    router.push('/dashboard');
  };

  // Loading state skeleton
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If already subscribed and active
  if (subscription?.status === 'active' && paymentState !== 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={softCardSpring}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Subscription
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your current plan and billing details
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={softCardSpring}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {subscription.plan} Plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active until {new Date(subscription.expiresAt).toLocaleDateString('en-PK')}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                Active
              </span>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Current Price: <span className="font-semibold">PKR {subscription.amount}/month</span>
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={softCardSpring}
                onClick={() => setPaymentState('idle')}
                className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
              >
                Change Plan →
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softCardSpring}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unlock premium features and unlimited AI-powered learning
          </p>
        </motion.div>

        {/* State Banners */}
        <AnimatePresence mode="wait">
          {paymentState === 'pending' && (
            <PendingBanner key="pending" transactionId={undefined} />
          )}
          {paymentState === 'success' && subscription && (
            <SuccessBanner
              key="success"
              planName={subscription.plan}
              expiresAt={subscription.expiresAt}
              onDismiss={handleDismissSuccess}
            />
          )}
          {paymentState === 'failed' && (
            <FailedBanner
              key="failed"
              onSubmitTransactionId={handleManualTransactionSubmit}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>

        {/* Plan Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...softCardSpring, delay: index * 0.1 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: `0 20px 40px ${plan.color}33`,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlanSelect(plan.id)}
                className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all ${
                  isSelected
                    ? 'border-[color:var(--brand-color)] bg-white dark:bg-gray-800 shadow-xl'
                    : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={
                  isSelected
                    ? ({ '--brand-color': plan.color } as React.CSSProperties)
                    : {}
                }
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price === 0 ? 'Free' : `PKR ${plan.price}`}
                    </span>
                    {plan.period && (
                      <span className="text-gray-600 dark:text-gray-400">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <motion.button
                  whileHover={{ scale: isSelected ? 1.02 : 1 }}
                  whileTap={{ scale: isSelected ? 0.98 : 1 }}
                  transition={softCardSpring}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </motion.button>

                {/* Border Glow Overlay */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 0 2px ${plan.color}`,
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Pay Now Button */}
        <AnimatePresence>
          {selectedPlan && selectedPlan !== 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={toastSpring}
              className="mt-8 text-center"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={softCardSpring}
                onClick={handlePayNow}
                disabled={isLoading}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Processing...' : 'Pay Now'}
              </motion.button>

              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Secure payment via EasyPaisa or JazzCash
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secure Lock Overlay */}
        <SecureLockOverlay
          isOpen={showLockOverlay}
          onClose={() => setShowLockOverlay(false)}
          planName={PLANS.find((p) => p.id === selectedPlan)?.name || ''}
          onConfirm={handleConfirmPayment}
        />
      </div>
    </div>
  );
}
