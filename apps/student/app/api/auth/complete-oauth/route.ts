import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import { signToken } from '@studyvault/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!nextAuthToken?.email) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    await connectDB();
    const user = await User.findOne({ email: nextAuthToken.email.toLowerCase() });
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const onboardingComplete = Boolean(
      user.onboardingComplete || user.student_profile?.onboarding_completed
    );

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      onboardingComplete,
    });

    const destination = onboardingComplete ? '/dashboard' : '/onboarding';
    const response = NextResponse.redirect(new URL(destination, req.url));
    response.cookies.set('sv_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}
