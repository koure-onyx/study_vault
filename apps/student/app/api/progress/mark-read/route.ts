import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@studyvault/lib/auth/getAuthUser';
import connectDB from '@studyvault/db/connect';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';

export async function POST(request: NextRequest) {
  try {
    // SECURE: Extract userId from session/token using unified auth
    const user = await getAuthUser(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { topicId, isRead = true, scrollDepthPercent = 0, timeSpentSeconds = 0 } = body;

    if (!topicId) {
      return NextResponse.json(
        { success: false, error: 'Missing topicId' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get topic to extract chapter, book, program info
    const topic = await Topic.findById(topicId).lean();
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Find or create progress record
    let progress = await UserProgress.findOne({ 
      user_id: user.id, 
      topic_id: topicId 
    });

    if (progress) {
      // Update existing progress
      progress.is_read = isRead || progress.is_read;
      progress.scroll_depth_percent = Math.max(progress.scroll_depth_percent, scrollDepthPercent);
      progress.time_spent_seconds = (progress.time_spent_seconds || 0) + timeSpentSeconds;
      progress.last_accessed = new Date();
      
      // Recalculate progress percent: 30% reading + 70% quiz
      const quizWeight = 0.7;
      const readingWeight = 0.3;
      const readingScore = progress.is_read ? 100 : 0;
      const quizScore = progress.highest_quiz_score || 0;
      progress.progress_percent = Math.round(
        (readingWeight * readingScore) + (quizWeight * quizScore)
      );
      
      await progress.save();
    } else {
      // Create new progress record
      progress = await UserProgress.create({
        user_id: user.id,
        topic_id: topicId,
        chapter_id: topic.chapter_id,
        book_id: topic.book_id,
        program_id: topic.program_id,
        is_read: isRead,
        scroll_depth_percent: scrollDepthPercent,
        time_spent_seconds,
        mastery_status: 'in_progress',
        progress_percent: isRead ? 30 : 0, // 30% from reading alone
        xp_earned: isRead ? 10 : 0, // Award 10 XP for marking as read
        last_accessed: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? (error as Error).message : 'Failed to mark as read' 
      },
      { status: 500 }
    );
  }
}
