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
    const { email, otp } = body;

    if (!email || !otp) {
      return error('Email and OTP are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return error('User not found', 404);
    }

    if (user.is_verified) {
      return error('Email already verified', 400);
    }

    // Check OTP
    if (user.otp !== otp) {
      return error('Invalid OTP', 400);
    }

    // Check OTP expiration
    if (user.otp_expires_at && new Date() > user.otp_expires_at) {
      return error('OTP has expired. Please request a new one.', 400);
    }

    // Verify user
    user.is_verified = true;
    user.otp = undefined;
    user.otp_expires_at = undefined;
    await user.save();

    return success({ message: 'Email verified successfully!' });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return error(err.message || 'Failed to verify OTP', 500);
  }
}
