// apps/student/proxy.ts
// Next.js 16.2.7+ - Root-level proxy replacing middleware.ts
// See: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PREMIUM_ROUTES = [
  '/premium-content',
  '/advanced-analytics',
  '/downloadable-content',
  '/family-plan',
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/onboarding',
  '/api/auth',
  '/api/search',
  '/api/checkout',
  '/api/webhooks',
  '/api/chapters',
  '/api/topics',
];

const AUTH_ROUTES = ['/login', '/signup'];
const PROTECTED_ROUTES = ['/dashboard', '/books', '/quran', '/profile', '/my-vault', '/progress', '/premium'];

async function getCustomToken(request: NextRequest) {
  const rawToken = request.cookies.get('sv_token')?.value;
  const secret = process.env.JWT_SECRET;
  if (!rawToken || !secret) return null;

  try {
    const { payload } = await jwtVerify(rawToken, new TextEncoder().encode(secret));
    return payload as any;
  } catch {
    return null;
  }
}

function isRoute(pathname: string, routes: string[]) {
  return routes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/** /grade-9/physics/chapter-1/topic → /physics/chapter-1/topic */
function legacyProgramSubjectRedirect(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)\/([^/]+)(\/.*)?$/);
  if (!match) return null;

  const [, programSlug, subjectSlug, rest = ''] = match;
  if (subjectSlug.startsWith('chapter-')) return null;

  const isLegacyProgram =
    /^grade-\d+/i.test(programSlug) ||
    /^class-\d+/i.test(programSlug) ||
    /^(mdcat|ecat)/i.test(programSlug) ||
    programSlug === 'federal' ||
    programSlug === 'intermediate';

  if (!isLegacyProgram) return null;

  return `/${subjectSlug}${rest}`;
}

export async function proxy(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal routes
  if (
    pathname.includes('.') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/proxy')
  ) {
    return NextResponse.next();
  }

  // Handle legacy program subject redirects
  // const legacyPath = legacyProgramSubjectRedirect(pathname);
  // if (legacyPath) {
  //   return NextResponse.redirect(new URL(legacyPath, request.url));
  // }

  try {
    const customToken = await getCustomToken(request);
    const nextAuthToken = process.env.NEXTAUTH_SECRET
      ? await import('next-auth/jwt').then(m => m.getToken({ req: request, secret: process.env.NEXTAUTH_SECRET }))
      : null;
    const token = customToken || nextAuthToken;
    const onboardingComplete = Boolean(
      (customToken as any)?.onboardingComplete ?? (nextAuthToken as any)?.onboardingComplete
    );
    const isApi = pathname.startsWith('/api');
    const isProtectedPage = isRoute(pathname, PROTECTED_ROUTES);
    const isAuthPage = isRoute(pathname, AUTH_ROUTES);
    const isOnboardingPage = pathname === '/onboarding';

    // API route handling
    if (isApi) {
      if (PUBLIC_ROUTES.some(route => route !== '/' && pathname.startsWith(route))) {
        return NextResponse.next();
      }

      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      return NextResponse.next();
    }

    // Redirect authenticated users away from auth pages
    if (token && isAuthPage) {
      return NextResponse.redirect(new URL(onboardingComplete ? '/dashboard' : '/onboarding', request.url));
    }

    // Redirect unauthenticated users away from onboarding
    if (!token && isOnboardingPage) {
      return NextResponse.redirect(new URL('/signup', request.url));
    }

    // Redirect completed onboarding users away from onboarding page
    if (token && isOnboardingPage && onboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect users with incomplete onboarding away from protected pages
    if (token && !onboardingComplete && isProtectedPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    
    // Redirect unauthenticated users to login for protected pages
    if (!token && isProtectedPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Premium route protection
    if (PREMIUM_ROUTES.some(route => pathname.startsWith(route))) {
      if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  } catch (error: any) {
    console.error('Proxy error:', error);
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.next();
  }
}
