import { NextRequest } from 'next/server';
import { requireAuth } from '@studyvault/lib/auth/middleware';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { topicId, score } = await req.json();

    if (!topicId || score === undefined)
      return Response.json({ success: false, error: 'topicId and score required' }, { status: 400 });
    if (score < 0 || score > 100)
      return Response.json({ success: false, error: 'Score must be 0-100' }, { status: 400 });

    await connectDB();
    const topic = await Topic.findById(topicId).select('chapter_id book_id program_id').lean();
    if (!topic) return Response.json({ success: false, error: 'Topic not found' }, { status: 404 });

    const existing = await UserProgress.findOne({ user_id: user._id, topic_id: topicId });
    const wasAlreadyMastered = existing?.mastery_status === 'mastered';
    const isRead = existing?.is_read || false;
    const newHighest = Math.max(existing?.highest_quiz_score || 0, score);

    const mastery_status = newHighest >= 80 ? 'mastered' : score > 0 ? 'in_progress' : 'locked';
    const progress_percent = Math.round(0.7 * newHighest + 0.3 * (isRead ? 100 : 0));

    // XP: +50 for first mastery, +5 for each attempt
    const xpGain = (!wasAlreadyMastered && mastery_status === 'mastered') ? 50 : 5;

    const progress = await UserProgress.findOneAndUpdate(
      { user_id: user._id, topic_id: topicId },
      {
        $set: {
          last_quiz_score: score,
          highest_quiz_score: newHighest,
          mastery_status,
          progress_percent,
          last_accessed: new Date(),
          chapter_id: topic.chapter_id,
          book_id: topic.book_id,
          program_id: topic.program_id,
        },
        $inc: { quiz_attempts: 1, xp_earned: xpGain },
      },
      { upsert: true, new: true }
    );

    return Response.json({
      success: true,
      data: {
        progress,
        mastered: mastery_status === 'mastered',
        firstMastery: !wasAlreadyMastered && mastery_status === 'mastered',
        xpGained: xpGain,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}