import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

/**
 * GET /api/admin/users/[userId]
 * PATCH /api/admin/users/[userId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
const { userId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(params.userId)
      .select('-password_hash -otp -password_reset_token')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('[Admin User GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { role, subscriptionStatus } = body;

    const updateData: Record<string, any> = {};
    if (role) updateData.role = role;
    if (subscriptionStatus) {
      updateData['subscription.status'] = subscriptionStatus;
    }

    const updatedUser = await User.findByIdAndUpdate(
      params.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash -otp -password_reset_token');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('[Admin User PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
