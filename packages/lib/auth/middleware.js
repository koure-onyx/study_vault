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
    throw Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw Response.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
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

export async function requireAdmin(request) {
  const user = await requireAuth(request);
  if (!['admin', 'superadmin'].includes(user.role)) {
    throw Response.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
  }
  return user;
}
