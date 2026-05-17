import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

const error = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return error('Token and new password are required');
    }

    if (password.length < 8) {
      return error('Password must be at least 8 characters');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return error('Password must contain uppercase, lowercase, and number');
    }

    // Hash the token to find the user
    const crypto = await import('crypto');
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      password_reset_token: resetTokenHash,
      password_reset_expires: { $gt: new Date() },
    });

    if (!user) {
      return error('Invalid or expired reset token', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update user
    user.password_hash = passwordHash;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    await user.save();

    return success({ message: 'Password reset successfully' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return error(err.message || 'Failed to reset password', 500);
  }
}
