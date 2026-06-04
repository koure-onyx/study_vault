import { NextRequest } from 'next/server';
import crypto from 'crypto';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp)
      return Response.json({ success: false, error: 'Email and OTP required' }, { status: 400 });

    await connectDB();
    const hashedOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      otp: hashedOtp,
      otp_expires_at: { $gt: new Date() },
    });

    if (!user)
      return Response.json({ success: false, error: 'Invalid or expired code' }, { status: 400 });

    await User.findByIdAndUpdate(user._id, {
      is_verified: true,
      $unset: { otp: '', otp_expires_at: '' },
    });

    return Response.json({ success: true, data: { message: 'Email verified successfully' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
