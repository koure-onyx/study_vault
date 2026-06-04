import { NextRequest } from 'next/server';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import { signToken } from '@studyvault/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json(); // Google ID token from frontend
    if (!credential)
      return Response.json({ success: false, error: 'Google credential required' }, { status: 400 });

    // Verify token with Google
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const google = await res.json();

    if (google.error || !google.email)
      return Response.json({ success: false, error: 'Invalid Google token' }, { status: 401 });

    // Verify audience matches our app
    if (process.env.GOOGLE_CLIENT_ID && google.aud !== process.env.GOOGLE_CLIENT_ID)
      return Response.json({ success: false, error: 'Token audience mismatch' }, { status: 401 });

    await connectDB();

    let user = await User.findOne({ email: google.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: google.name || google.email.split('@')[0],
        email: google.email.toLowerCase(),
        google_id: google.sub,
        avatar_url: google.picture,
        is_verified: true,
        role: 'student',
        onboardingComplete: false,
        student_profile: {
          onboarding_completed: false,
        },
      });
    } else if (!user.google_id) {
      await User.findByIdAndUpdate(user._id, { google_id: google.sub, is_verified: true });
    }

    const onboardingComplete = Boolean(user.onboardingComplete || user.student_profile?.onboarding_completed);
    const token = signToken({ userId: user._id, role: user.role, onboardingComplete });
    const response = Response.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url, onboardingComplete },
      },
    });
    response.headers.set('Set-Cookie',
      `sv_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    );
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
