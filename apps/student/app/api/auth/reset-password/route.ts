import { NextRequest } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password)
      return Response.json({ success: false, error: 'Token and password required' }, { status: 400 });
    if (password.length < 8)
      return Response.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });

    await connectDB();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      password_reset_token: hashedToken,
      password_reset_expires: { $gt: new Date() },
    });

    if (!user)
      return Response.json({ success: false, error: 'Reset link is invalid or has expired' }, { status: 400 });

    const password_hash = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(user._id, {
      password_hash,
      $unset: { password_reset_token: '', password_reset_expires: '' },
    });

    return Response.json({ success: true, data: { message: 'Password reset successfully. You can now log in.' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
