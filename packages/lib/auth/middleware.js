import { verifyToken } from './jwt.js';
import connectDB from '@studyvault/db/connect.js';
import User from '@studyvault/db/models/User.js';

// Use in any protected API route: const user = await requireAuth(request)
export async function requireAuth(request) {
  const header = request.headers.get('authorization') || '';
  // Also check cookie (for SSR pages)
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieToken = cookieHeader.match(/sv_token=([^;]+)/)?.[1];
  
  const token = header.startsWith('Bearer ') ? header.slice(7) : cookieToken;
  
  if (!token) {
    // No token – treat as guest (unauthenticated)
    return null;
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return null;
  }

  await connectDB();
  const user = await User.findById(decoded.userId)
    .select('-password_hash -otp -password_reset_token')
    .lean();

  if (!user) {
    throw Response.json({ success: false, error: 'User not found' }, { status: 401 });
  }

  return user;
}

  try {
    const user = await requireAuth(request);
    if (!user) {
      // Guest user – skip admin check
      return null;
    }
    if (!['admin', 'superadmin'].includes(user.role)) {
      throw Response.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
    }
    return user;
  } catch (err) {
    // If requireAuth returns null, just propagate null
    return null;
  }
