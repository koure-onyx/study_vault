import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import { signToken, verifyToken } from '@studyvault/lib/auth/jwt';
import { resolveUserContentProfile } from '@studyvault/lib/content/bookFilter';

async function getRequestUser(req: NextRequest) {
  const customToken = req.cookies.get('sv_token')?.value;

  await connectDB();

  if (customToken) {
    try {
      const decoded = verifyToken(customToken) as any;
      const user = await User.findById(decoded.userId);
      if (user) return user;
    } catch {}
  }

  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!nextAuthToken?.email) return null;

  return User.findOne({ email: nextAuthToken.email.toLowerCase() });
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { board, grade, class: className } = await req.json();
    if (!board || !grade || !className) {
      return Response.json({ success: false, error: 'Board, grade and class are required' }, { status: 400 });
    }

    user.board = board;
    user.grade = grade;
    user.class = className;
    user.onboardingComplete = true;
    user.student_profile = {
      ...(user.student_profile?.toObject?.() || user.student_profile || {}),
      board,
      grade,
      class: className,
      onboarding_completed: true,
    };

    await user.save();

    const { boardId, programId } = await resolveUserContentProfile(user);
    if (boardId || programId) {
      await User.findByIdAndUpdate(user._id, {
        ...(boardId && { 'student_profile.board_id': boardId }),
        ...(programId && {
          'student_profile.active_program_id': programId,
          'student_profile.program_ids': [programId],
        }),
      });
      if (boardId) user.student_profile.board_id = boardId;
      if (programId) {
        user.student_profile.active_program_id = programId;
        user.student_profile.program_ids = [programId];
      }
    }

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      onboardingComplete: true,
    });
    const response = Response.json({ success: true, data: { user: { id: user._id, board, grade, class: className, onboardingComplete: true } } });
    response.headers.set('Set-Cookie',
      `sv_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    );

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
