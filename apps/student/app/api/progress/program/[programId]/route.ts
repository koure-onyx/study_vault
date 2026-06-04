import { NextRequest } from 'next/server';
import { requireAuth } from '@studyvault/lib/auth/middleware';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const user = await requireAuth(req);
    await connectDB();

    const totalTopics = await Topic.countDocuments({ program_id: programId, is_live: true });
    const userProgress = await UserProgress.find({
      user_id: user._id,
      program_id: params.programId,
    }).lean();

    const mastered = userProgress.filter(p => p.mastery_status === 'mastered').length;
    const inProgress = userProgress.filter(p => p.mastery_status === 'in_progress').length;
    const totalXP = userProgress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
    const overallPercent = totalTopics > 0 ? Math.round((mastered / totalTopics) * 100) : 0;

    return Response.json({
      success: true,
      data: { totalTopics, mastered, inProgress, totalXP, overallPercent },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}