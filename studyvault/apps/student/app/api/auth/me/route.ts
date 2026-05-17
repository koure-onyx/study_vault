import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

const error = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

export async function GET(request: Request) {
  try {
    await connectDB();

    // Get token from cookie
    const cookies = request.cookies.get('auth-token');
    
    if (!cookies?.value) {
      return error('Not authenticated', 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const decoded = jwt.verify(cookies.value, JWT_SECRET) as { userId: string };

    const user = await User.findById(decoded.userId).select('-password_hash -otp');
    
    if (!user) {
      return error('User not found', 404);
    }

    return success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
        student_profile: user.student_profile,
        subscription: user.subscription,
      },
    });
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return error('Invalid or expired token', 401);
    }
    console.error('Get user error:', err);
    return error(err.message || 'Failed to get user', 500);
  }
}
