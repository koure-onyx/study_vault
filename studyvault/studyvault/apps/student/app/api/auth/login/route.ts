import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

// Standard response helpers
const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

const error = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return error('Email and password are required');
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return error('Invalid email or password', 401);
    }

    // Check if user has a password (OAuth users don't)
    if (!user.password_hash) {
      return error('Please login with Google for this account', 400);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return error('Invalid email or password', 401);
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last active
    if (user.role === 'student') {
      user.student_profile.last_active = new Date();
      await user.save();
    }

    // Set httpOnly cookie
    const response = success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
      },
      token,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return error(err.message || 'Failed to login', 500);
  }
}
