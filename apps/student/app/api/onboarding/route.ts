import { NextRequest } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Board from '@studyvault/db/models/Board';
import Program from '@studyvault/db/models/Program';
import User from '@studyvault/db/models/User';
import { requireAuth } from '@studyvault/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    // We don't necessarily need auth to see boards/programs during onboarding
    await connectDB();
    
    const [boards, programs] = await Promise.all([
      Board.find({ is_active: true }).sort({ name: 1 }).lean(),
      Program.find({ is_active: true }).sort({ display_order: 1 }).lean()
    ]);

    return Response.json({
      success: true,
      data: { boards, programs }
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { boardId, programId, medium } = await req.json();

    if (!boardId || !programId || !medium) {
      return Response.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    await connectDB();

    await User.findByIdAndUpdate(user._id, {
      'student_profile.board_id': boardId,
      'student_profile.active_program_id': programId,
      'student_profile.program_ids': [programId],
      'student_profile.medium': medium,
      'student_profile.onboarding_completed': true
    });

    return Response.json({ success: true, message: 'Onboarding completed successfully' });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
