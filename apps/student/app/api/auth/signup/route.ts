import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import { signToken } from '@studyvault/lib/auth/jwt';
import { sendOtpEmail } from '@studyvault/lib/utils/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = 'student' } = await req.json();

    if (!name || !email || !password)
      return Response.json({ success: false, error: 'Name, email and password are required' }, { status: 400 });

    if (password.length < 8)
      return Response.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return Response.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });

    const password_hash = await bcrypt.hash(password, 12);
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role: ['student','parent'].includes(role) ? role : 'student',
      otp: hashedOtp,
      otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
      is_verified: false,
      onboardingComplete: false,
      student_profile: {
        onboarding_completed: false,
      },
    });

    // Do not block signup on email delivery (misconfigured SMTP can hang for minutes)
    void sendOtpEmail(user.email, rawOtp, user.name).catch((err) => {
      console.error('[signup] OTP email failed:', err instanceof Error ? err.message : err);
    });

    let token: string;
    try {
      token = signToken({
        userId: user._id,
        email: user.email,
        role: user.role,
        onboardingComplete: false,
      });
    } catch (tokenErr) {
      console.error('[signup] JWT sign failed:', tokenErr);
      return Response.json(
        { success: false, error: 'Server misconfigured: JWT_SECRET is missing or invalid.' },
        { status: 500 }
      );
    }

    const response = Response.json({ success: true }, { status: 201 });

    response.headers.set('Set-Cookie',
      `sv_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    );

    return response;

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
