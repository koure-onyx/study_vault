import { NextRequest } from 'next/server';
import crypto from 'crypto';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import { sendPasswordResetEmail } from '@studyvault/lib/utils/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ success: false, error: 'Email required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success — don't reveal if email exists
    if (!user) return Response.json({ success: true, data: { message: 'If that email exists, a reset link has been sent.' } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      password_reset_token: hashedToken,
      password_reset_expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await sendPasswordResetEmail(user.email, rawToken, user.name);

    return Response.json({ success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
