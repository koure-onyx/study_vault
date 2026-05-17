import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import crypto from 'crypto';

// Standard response helpers
const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

const error = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password, role = 'student' } = body;

    // Validation
    if (!name || !email || !password) {
      return error('Name, email, and password are required');
    }

    if (name.trim().length < 2) {
      return error('Name must be at least 2 characters');
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return error('Please enter a valid email address');
    }

    if (password.length < 8) {
      return error('Password must be at least 8 characters');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return error('Password must contain uppercase, lowercase, and number');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return error('An account with this email already exists', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate OTP for email verification
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role,
      otp,
      otp_expires_at: otpExpiresAt,
      is_verified: false,
      student_profile: role === 'student' ? {
        xp_total: 0,
        streak_days: 0,
      } : undefined,
    });

    // TODO: Send verification email with OTP
    console.log(`[DEV] Verification OTP for ${email}: ${otp}`);

    // Return user data without sensitive fields
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
    };

    return success(
      { 
        user: userData,
        message: 'Account created successfully. Please verify your email.',
        requiresVerification: true,
      },
      201
    );
  } catch (err: any) {
    console.error('Signup error:', err);
    return error(err.message || 'Failed to create account', 500);
  }
}
