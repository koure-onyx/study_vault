import { NextRequest } from 'next/server';
import { requireAuth } from '@studyvault/lib/auth/middleware';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';
import Chapter from '@studyvault/db/models/Chapter';

export async function GET(req: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const { chapterId } = await params;
    const user = await requireAuth(req);
    await connectDB();

    const chapter = await Chapter.findById(chapterId).select('topic_ids total_topics title').lean();
    if (!chapter) return Response.json({ success: false, error: 'Chapter not found' }, { status: 404 });

    const progressRecords = await UserProgress.find({
      user_id: user._id,
      topic_id: { $in: chapter.topic_ids },
    }).lean();

    const progressMap = Object.fromEntries(progressRecords.map(p => [p.topic_id.toString(), p]));
    const mastered = progressRecords.filter(p => p.mastery_status === 'mastered').length;
    const chapterPercent = chapter.total_topics > 0
      ? Math.round((mastered / chapter.total_topics) * 100) : 0;

    return Response.json({
      success: true,
      data: { progressMap, mastered, total: chapter.total_topics, chapterPercent },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}