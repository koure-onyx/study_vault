'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, SpringOptions } from 'framer-motion';
import { SWRConfig } from 'swr';

const springPresets: Record<string, SpringOptions> = {
  snappyButton: { stiffness: 400, damping: 20, mass: 0.5 },
  softCards: { stiffness: 100, damping: 15, mass: 1.0 },
  toast: { stiffness: 300, damping: 25, mass: 0.8 },
};

function AuthLoadingSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.softCards}
        className="relative w-full max-w-md p-8 mx-4"
      >
        <div
          className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
          style={{ boxShadow: '0 4px 30px hsla(0, 0%, 0%, 0.1)' }}
        >
          <div className="flex flex-col items-center justify-center py-12">
            <motion.svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-6">
              <motion.circle cx="32" cy="32" r="28" stroke="url(#g1)" strokeWidth="2" strokeLinecap="round" fill="none" initial={{ pathLength: 0.2, rotate: -90 }} animate={{ pathLength: 1, rotate: 270 }} transition={{ duration: 1.5, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} style={{ transformOrigin: 'center' }} />
              <motion.circle cx="32" cy="32" r="12" fill="url(#g2)" initial={{ scale: 0.8, opacity: 0.5 }} animate={{ scale: 1.2, opacity: 0 }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3, ...springPresets.toast }} />
              <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#EC4899" /></linearGradient>
                <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" /><stop offset="100%" stopColor="#EC4899" stopOpacity="0.6" /></linearGradient>
              </defs>
            </motion.svg>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...springPresets.snappyButton }} className="text-lg font-semibold text-white/90" style={{ textShadow: '0 1px 2px hsla(0, 0%, 0%, 0.15)' }}>Securing your session...</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-2 text-sm text-white/60">Verifying credentials with NextAuth</motion.p>
          </div>
          <div className="px-8 pb-8"><div className="h-1 w-full bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-gradient-to-r from-purple-500 to-pink-500" /></div></div>
        </div>
      </motion.div>
    </div>
  );
}

interface AuthErrorFallbackProps { error: string; onRetry: () => void; }

function AuthErrorFallback({ error, onRetry }: AuthErrorFallbackProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={springPresets.softCards} className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springPresets.snappyButton} className="w-full max-w-md mx-4 p-8 rounded-2xl bg-white/5 border border-red-500/20 backdrop-blur-xl" style={{ boxShadow: '0 4px 30px hsla(0, 0%, 0%, 0.2)' }}>
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, ...springPresets.toast }} className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ textShadow: '0 1px 2px hsla(0, 0%, 0%, 0.15)' }}>Authentication Failed</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRetry} transition={springPresets.snappyButton} className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold" style={{ textShadow: '0 1px 2px hsla(0, 0%, 0%, 0.2)', boxShadow: '0 4px 15px hsla(280, 100%, 50%, 0.3)' }}>Try Again</motion.button>
          <button onClick={() => window.location.href = '/'} className="mt-4 text-sm text-white/50 hover:text-white/80 transition-colors">Return to Home</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AuthLanding({ onGoogleSignIn, isLoading }: { onGoogleSignIn: () => void; isLoading: boolean }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const error = searchParams?.get('error');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, ...springPresets.softCards }} className="text-center mb-12">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, ...springPresets.snappyButton }} className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            </div>
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ textShadow: '0 2px 4px hsla(0, 0%, 0%, 0.2)' }}>Welcome to{' '}<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">StudyVault</span></motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-lg text-white/70 max-w-md mx-auto">Your personal AI-powered study companion for Pakistani board exams</motion.p>
          {error && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, ...springPresets.toast }} className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"><p className="text-red-400 text-sm">{error === 'OAuthAccountNotLinked' ? 'This email is already registered with a different sign-in method.' : 'Authentication failed. Please try again.'}</p></motion.div>)}
        </motion.div>

        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, ...springPresets.softCards }} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8" style={{ backdropFilter: 'blur(12px)', boxShadow: '0 4px 30px hsla(0, 0%, 0%, 0.1), 0 0 0 1px hsla(0, 0%, 100%, 0.05)' }}>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" /><div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="text-center mb-8"><h2 className="text-2xl font-bold text-white mb-2" style={{ textShadow: '0 1px 2px hsla(0, 0%, 0%, 0.15)' }}>Continue your journey</h2><p className="text-white/60 text-sm">Sign in to access your personalized study dashboard</p></div>
            <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={onGoogleSignIn} disabled={isLoading} transition={springPresets.snappyButton} className="w-full py-4 px-6 rounded-2xl bg-white text-slate-900 font-semibold flex items-center justify-center gap-3 relative overflow-hidden group" style={{ textShadow: '0 1px 2px hsla(0, 0%, 0%, 0.1)', boxShadow: '0 4px 15px hsla(0, 0%, 0%, 0.1), inset 0 1px 0 hsla(0, 0%, 100%, 0.5)' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.766 12.2764c0-.8909-.0773-1.7463-.2255-2.5727H12v4.8736h6.6091c-.2864 1.5328-1.1582 2.8282-2.4709 3.7182v3.0991h3.9618c2.3182-2.1318 3.6659-5.2682 3.6659-9.1182z" /><path fill="#34A853" d="M12 24c3.3091 0 6.0845-1.0909 8.1023-2.9673l-3.9618-3.0991c-1.0909.7318-2.4845 1.1636-4.1405 1.1636-3.1864 0-5.8845-2.15-6.8464-5.0455H1.0909v3.2273C3.0273 21.2364 7.2364 24 12 24z" /><path fill="#FBBC05" d="M5.15363 14.0545c-.24545-.7318-.38455-1.5136-.38455-2.3273s.1391-1.5955.38455-2.3273V6.17273H1.0909C.39273 7.55455 0 9.13636 0 10.8273s.39273 3.2727 1.0909 4.6545l4.06273-3.2273z" /><path fill="#EA4335" d="M12 4.90909c1.8045 0 3.4273.62182 4.7045 1.83636l3.54-3.54C18.0909 1.23636 15.3136 0 12 0 7.23636 0 3.02727 2.76364 1.09091 6.17273l4.06273 3.22727c.96182-2.89545 3.66-5.04545 6.84636-5.04545z" /></svg>
              <span className="relative z-10">{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
              {isLoading && (<motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-5 h-5 absolute right-6" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" /><motion.path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} /></motion.svg>)}
            </motion.button>
            <div className="relative my-8"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-gradient-to-r from-transparent via-white/5 to-transparent px-4 text-white/50">Or continue with email</span></div></div>
            <div className="text-center"><a href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-sm text-white/60 hover:text-white/90 transition-colors inline-flex items-center gap-2 group">Sign in with email<motion.span initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} className="group-hover:text-purple-400">→</motion.span></a></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-12 text-center">
          <div className="flex items-center justify-center gap-6 text-xs text-white/40">
            <div className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg><span>Secure authentication</span></div>
            <div className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg><span>Instant access</span></div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => { if (status === 'authenticated' && session?.user) { router.push('/dashboard'); } }, [status, session, router]);

  const handleGoogleSignIn = useCallback(async () => { setIsLoading(true); setAuthError(null); try { await signIn('google', { callbackUrl: '/dashboard' }); } catch (error) { console.error('Google sign-in error:', error); setAuthError('Failed to connect with Google. Please try again.'); setIsLoading(false); } }, []);
  const handleRetry = useCallback(() => { setAuthError(null); setIsLoading(false); }, []);

  if (status === 'loading' || isLoading) { return <AuthLoadingSkeleton />; }
  if (authError) { return (<AnimatePresence><AuthErrorFallback error={authError} onRetry={handleRetry} /></AnimatePresence>); }

  return (<SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 5000 }}><AuthLanding onGoogleSignIn={handleGoogleSignIn} isLoading={isLoading} /></SWRConfig>);
}
