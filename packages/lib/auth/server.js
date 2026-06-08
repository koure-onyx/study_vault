import { cookies } from 'next/headers';
import { verifyJWTToken, getUnifiedUser } from './unified-auth';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User.js';
import { getToken } from 'next-auth/jwt';

export async function getJwtPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sv_token')?.value;
  if (!token) return null;
  try {
    return verifyJWTToken(token);
  } catch {
    return null;
  }
}

export const getUser = getServerUser;

export async function getServerUser() {
  try {
    // Try NextAuth token first
    const token = await getToken({
      req: { headers: { cookie: (await cookies()).toString() } },
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token?.email) {
      await connectDB();
      const user = await User.findOne({ 
        email: token.email.toLowerCase() 
      }).select('-password_hash -otp -password_reset_token').lean();
      return user;
    }

    // Fall back to custom JWT token
    const cookieStore = await cookies();
    const customToken = cookieStore.get('sv_token')?.value;
    
    if (customToken) {
      const decoded = verifyJWTToken(customToken);
      if (decoded?.userId || decoded?.sub || decoded?.id) {
        await connectDB();
        const userId = decoded.userId || decoded.sub || decoded.id;
        const user = await User.findById(userId)
          .select('-password_hash -otp -password_reset_token')
          .lean();
        return user;
      }
    }

    return null;
  } catch (err) {
    console.error('Get server user error:', err);
    return null;
  }
}

// Unified authentication check
export async function requireAuth() {
  const user = await getServerUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Check if user has required role
export async function requireRole(requiredRole) {
  const user = await requireAuth();
  if (user.role !== requiredRole && user.role !== 'superadmin') {
    throw new Error('Insufficient permissions');
  }
  return user;
}
