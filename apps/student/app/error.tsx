'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Log error to monitoring service (e.g., Sentry)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      console.error('Error captured:', {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  }, [error]);

  if (!isClient) {
    return null;
  }

  const getFriendlyMessage = (errorCode?: string) => {
    if (errorCode?.includes('NEXT_NOT_FOUND')) {
      return {
        title: 'Page Nahi Mila',
        message: 'Shayad yeh page move ho gaya hai ya delete ho gaya hai. Home page par wapis jayen.',
        icon: '🔍',
      };
    }
    if (errorCode?.includes('NEXT_REDIRECT')) {
      return {
        title: 'Redirect Ho Raha Hai',
        message: 'Aap ko doosre page par le jaya ja raha hai. Agar yeh na ho, to refresh karein.',
        icon: '🔄',
      };
    }
    if (errorCode?.includes('ECONNREFUSED') || errorCode?.includes('NETWORK')) {
      return {
        title: 'Internet Connection Check Karein',
        message: 'Lagta hai aap ka internet connection theek nahi hai. Apna connection check karein aur dubara try karein.',
        icon: '📡',
      };
    }
    if (errorCode?.includes('AUTH') || errorCode?.includes('UNAUTHORIZED')) {
      return {
        title: 'Login Zaroori Hai',
        message: 'Yeh feature dekhne ke liye please login karein.',
        icon: '🔐',
      };
    }
    
    // Default generic error
    return {
      title: 'Kuch Ghalat Ho Gaya',
      message: 'Maazrat chahte hain, kuch technical masla aa gaya hai. Hum isay fix kar rahe hain.',
      icon: '⚠️',
    };
  };

  const friendlyError = getFriendlyMessage(error.digest);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/90 backdrop-blur-sm shadow-xl border border-emerald-100 overflow-hidden">
        {/* Decorative Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 w-full" />
        
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="text-6xl mb-4 animate-bounce-slow">
            {friendlyError.icon}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
            {friendlyError.title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {friendlyError.message}
          </p>

          {/* Technical Details (Collapsible) */}
          <details className="text-left mb-6 group">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-emerald-600 transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Technical Details (Developers ke liye)
            </summary>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs font-mono text-gray-700 overflow-x-auto">
              <p className="mb-2"><strong>Error:</strong> {error.message}</p>
              {error.digest && (
                <p className="mb-2"><strong>Digest:</strong> {error.digest}</p>
              )}
              {error.stack && (
                <pre className="whitespace-pre-wrap break-words mt-2 text-[10px] text-gray-500">
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              variant="primary"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5"
            >
              🔄 Dobara Try Karein
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              🏠 Home Page
            </Button>
          </div>

          {/* Support Link */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Masla hal nahi ho raha?{' '}
              <a 
                href="mailto:support@studyvault.pk" 
                className="text-emerald-600 hover:text-emerald-700 font-medium underline decoration-emerald-300 hover:decoration-emerald-500 transition-all"
              >
                Support se raabta karein
              </a>
            </p>
          </div>
        </div>

        {/* Decorative Footer Pattern */}
        <div className="h-1 bg-gradient-to-r from-transparent via-emerald-200 to-transparent opacity-50" />
      </Card>
    </div>
  );
}
