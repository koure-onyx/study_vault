import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

// Premium content routes that require subscription
const PREMIUM_ROUTES = [
  '/premium-content',
  '/advanced-analytics',
  '/downloadable-content',
  '/family-plan',
];

// Routes that are always public
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/api/auth',
  '/api/checkout',
  '/api/webhooks',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and static files
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.includes('.') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  try {
    await connectDB();

    // Get user from JWT token
    const token = await getToken({ req: request });
    
    // If no token, redirect to login for protected routes
    if (!token && !pathname.startsWith('/api')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For API routes, check authentication
    if (pathname.startsWith('/api') && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Check premium access for premium routes
    if (PREMIUM_ROUTES.some(route => pathname.startsWith(route))) {
      if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Fetch user to check subscription status
      const user = await User.findById(token.sub);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const isPremium = ['basic', 'premium', 'family'].includes(user.subscription?.plan || '');
      const isExpired = user.subscription?.expires_at 
        ? new Date(user.subscription.expires_at) < new Date()
        : false;

      if (!isPremium || isExpired) {
        // Redirect to premium page with upgrade prompt
        const premiumUrl = new URL('/premium', request.url);
        premiumUrl.searchParams.set('upgrade_required', 'true');
        premiumUrl.searchParams.set('callbackUrl', pathname);
        
        if (pathname.startsWith('/api')) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Premium subscription required',
              upgradeUrl: premiumUrl.toString()
            },
            { status: 403 }
          );
        }
        
        return NextResponse.redirect(premiumUrl);
      }
    }

    // Check AI credit limits for AI routes
    if (pathname.startsWith('/api/ai')) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const user = await User.findById(token.sub);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const plan = user.subscription?.plan || 'free';
      const dailyLimits: Record<string, number> = {
        free: 5,
        basic: 50,
        premium: -1, // unlimited
        family: -1,
      };

      const dailyLimit = dailyLimits[plan] || 5;
      const creditsUsed = user.subscription?.ai_credits_used_today || 0;
      const resetAt = user.subscription?.ai_credits_reset_at;

      // Check if credits need to be reset (new day)
      const now = new Date();
      const shouldReset = !resetAt || 
        resetAt.getDate() !== now.getDate() ||
        resetAt.getMonth() !== now.getMonth() ||
        resetAt.getFullYear() !== now.getFullYear();

      if (shouldReset && user.subscription) {
        user.subscription.ai_credits_used_today = 0;
        user.subscription.ai_credits_reset_at = now;
        await user.save();
      }

      // Check if user has exceeded daily limit (only for limited plans)
      if (dailyLimit !== -1 && creditsUsed >= dailyLimit) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Daily AI credit limit reached. Upgrade to premium for unlimited access.',
            limit: dailyLimit,
            used: creditsUsed,
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.next();

  } catch (error: any) {
    console.error('Middleware error:', error);
    
    // Fail open for non-critical errors, but log them
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (css, js, media, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
