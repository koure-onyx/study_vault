'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { SWRConfig } from 'swr';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Shield, Clock, CheckCircle, AlertCircle, ArrowRight, LogIn } from 'lucide-react';

// Mobile-first loading skeleton using design tokens
function AuthLoadingSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md p-4">
        <Card variant="elevated">
          <div className="flex flex-col items-center justify-center py-12">
            <Skeleton className="w-16 h-16 rounded-2xl mb-6" />
            <Skeleton className="w-48 h-6 mb-3" />
            <Skeleton className="w-64 h-4" />
          </div>
          <div className="px-6 pb-6">
            <Skeleton className="w-full h-2 rounded-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// Error state with accessibility
interface AuthErrorFallbackProps { 
  error: string; 
  onRetry: () => void; 
}

function AuthErrorFallback({ error, onRetry }: AuthErrorFallbackProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <Card variant="outlined" className="border-error/20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-error" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Authentication Failed</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <Button 
              variant="primary" 
              onClick={onRetry}
              className="w-full"
              aria-label="Retry authentication"
            >
              Try Again
            </Button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="mt-4 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Return to Home
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Main login UI - light mode, mobile-first
interface AuthLandingProps { 
  onGoogleSignIn: () => void; 
  isLoading: boolean;
  error?: string | null;
}

function AuthLanding({ onGoogleSignIn, isLoading, error }: AuthLandingProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const authError = error || searchParams?.get('error');

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <Shield className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Welcome to StudyVault
          </h1>
          <p className="text-base text-text-secondary max-w-md mx-auto">
            Your personal AI-powered study companion for Pakistani board exams
          </p>
          {authError && (
            <div className="mt-6 p-4 rounded-lg bg-error/5 border border-error/20">
              <p className="text-error text-sm">
                {authError === 'OAuthAccountNotLinked' 
                  ? 'This email is already registered with a different sign-in method.' 
                  : 'Authentication failed. Please try again.'}
              </p>
            </div>
          )}
        </div>

        {/* Login Card */}
        <Card variant="elevated" className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Continue your journey
            </h2>
            <p className="text-sm text-text-secondary">
              Sign in to access your personalized study dashboard
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            variant="outline"
            onClick={onGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 mb-6"
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.766 12.2764c0-.8909-.0773-1.7463-.2255-2.5727H12v4.8736h6.6091c-.2864 1.5328-1.1582 2.8282-2.4709 3.7182v3.0991h3.9618c2.3182-2.1318 3.6659-5.2682 3.6659-9.1182z"/><path fill="#34A853" d="M12 24c3.3091 0 6.0845-1.0909 8.1023-2.9673l-3.9618-3.0991c-1.0909.7318-2.4845 1.1636-4.1405 1.1636-3.1864 0-5.8845-2.15-6.8464-5.0455H1.0909v3.2273C3.0273 21.2364 7.2364 24 12 24z"/><path fill="#FBBC05" d="M5.15363 14.0545c-.24545-.7318-.38455-1.5136-.38455-2.3273s.1391-1.5955.38455-2.3273V6.17273H1.0909C.39273 7.55455 0 9.13636 0 10.8273s.39273 3.2727 1.0909 4.6545l4.06273-3.2273z"/><path fill="#EA4335" d="M12 4.90909c1.8045 0 3.4273.62182 4.7045 1.83636l3.54-3.54C18.0909 1.23636 15.3136 0 12 0 7.23636 0 3.02727 2.76364 1.09091 6.17273l4.06273 3.22727c.96182-2.89545 3.66-5.04545 6.84636-5.04545z"/></svg>}
          >
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-primary px-4 text-text-muted">Or continue with email</span>
            </div>
          </div>

          {/* Email Sign In Link */}
          <div className="text-center">
            <a 
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} 
              className="text-sm text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-2 group"
            >
              Sign in with email
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </a>
          </div>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Secure authentication</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Instant access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Preserve backend logic: redirect on auth
  useEffect(() => { 
    if (status === 'authenticated' && session?.user) { 
      router.push('/dashboard'); 
    } 
  }, [status, session, router]);

  // Preserve backend logic: Google OAuth sign-in
  const handleGoogleSignIn = useCallback(async () => { 
    setIsLoading(true); 
    setAuthError(null); 
    try { 
      await signIn('google', { callbackUrl: '/dashboard' }); 
    } catch (error) { 
      console.error('Google sign-in error:', error); 
      setAuthError('Failed to connect with Google. Please try again.'); 
      setIsLoading(false); 
    } 
  }, []);

  const handleRetry = useCallback(() => { 
    setAuthError(null); 
    setIsLoading(false); 
  }, []);

  // Loading state
  if (status === 'loading' || isLoading) { 
    return <AuthLoadingSkeleton />; 
  }

  // Error state
  if (authError) { 
    return <AuthErrorFallback error={authError} onRetry={handleRetry} />;
  }

  // Main UI
  return (
    <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 5000 }}>
      <AuthLanding 
        onGoogleSignIn={handleGoogleSignIn} 
        isLoading={isLoading}
        error={authError}
      />
    </SWRConfig>
  );
}
