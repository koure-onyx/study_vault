import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import { signToken } from '@studyvault/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return Response.json({ success: false, error: 'Email and password required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password_hash)
      return Response.json({ success: false, error: 'Invalid email or password' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return Response.json({ success: false, error: 'Invalid email or password' }, { status: 401 });

    const onboardingComplete = Boolean(user.onboardingComplete || user.student_profile?.onboarding_completed);
    const token = signToken({ userId: user._id, email: user.email, role: user.role, onboardingComplete });

    // Update last active
    await User.findByIdAndUpdate(user._id, { 'student_profile.last_active': new Date() });

    const response = Response.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id, name: user.name, email: user.email,
          role: user.role, is_verified: user.is_verified,
          avatar_url: user.avatar_url,
          onboardingComplete,
        },
      },
    });

    // Set httpOnly cookie so SSR pages can read auth
    response.headers.set('Set-Cookie',
      `sv_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    );

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
