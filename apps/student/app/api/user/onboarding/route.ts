import { NextRequest } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@studyvault/lib/auth/getAuthUser';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { board, grade, className } = await req.json();

    if (!board || !grade) {
      return Response.json({ success: false, error: 'Board and grade are required' }, { status: 400 });
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        $set: {
          'student_profile.board': board,
          'student_profile.grade': grade,
          'student_profile.class': className,
          'student_profile.onboarding_completed': true,
        },
      },
      { new: true }
    ).select('-password_hash -otp -password_reset_token');

    return Response.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
