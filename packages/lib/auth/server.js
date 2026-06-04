import { cookies } from 'next/headers';
import { verifyToken } from './jwt.js';
import connectDB from '@studyvault/db/connect.js';
import User from '@studyvault/db/models/User.js';
import { getToken } from 'next-auth/jwt';

export async function getJwtPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sv_token')?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export const getUser = getServerUser;

export async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sv_token')?.value;

  try {
    await connectDB();
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId)
        .select('-password_hash -otp -password_reset_token')
        .lean();
      if (user) return user;
    }

    if (!process.env.NEXTAUTH_SECRET) return null;

    const nextAuthToken = await getToken({
      req: { headers: { cookie: cookieStore.toString() } },
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!nextAuthToken?.email) return null;

    return await User.findOne({ email: nextAuthToken.email.toLowerCase() })
      .select('-password_hash -otp -password_reset_token')
      .lean();
  } catch (err) {
    return null;
  }
}
