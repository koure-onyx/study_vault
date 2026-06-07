import { NextRequest } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@studyvault/lib/auth/getAuthUser';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';

export async function GET(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { programId } = await params;
    await connectDB();

    const progressRecords = await UserProgress.find({
      user_id: user.id,
      program_id: programId,
    }).lean();

    const mastered = progressRecords.filter(p => p.mastery_status === 'mastered').length;
    const inProgress = progressRecords.filter(p => p.mastery_status === 'in_progress').length;
    const totalTopics = progressRecords.length;

    return Response.json({
      success: true,
      data: { 
        mastered, 
        inProgress, 
        totalTopics,
        progress: progressRecords 
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
