import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

/**
 * GET /api/admin/users
 * Returns list of all users with projection
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const users = await User.find({})
      .select('_id name email role subscription status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionStatus: (user as any).subscription?.status || 'free',
        createdAt: user.createdAt
      }))
    });

  } catch (error) {
    console.error('[Admin Users GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
