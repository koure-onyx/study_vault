import { NextResponse } from 'next/server';
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
    const { email } = body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return error('Please enter a valid email address');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return error('No account found with this email', 404);
    }

    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.password_reset_token = resetTokenHash;
    user.password_reset_expires = resetExpires;
    await user.save();

    // TODO: Send email with reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);

    return success({ 
      message: 'Password reset link sent to your email',
      // In production, don't expose the link
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return error(err.message || 'Failed to send reset link', 500);
  }
}
